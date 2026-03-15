/**
 * Daily Quote Generator
 * ─────────────────────────────────────────────────────────────
 * A clean AngularJS (1.x) application that fetches motivational
 * quotes from a Supabase PostgreSQL backend and displays them
 * with a polished, animated UI.
 *
 * Architecture:
 *   - Module       : dailyQuoteApp
 *   - Service      : SupabaseService  (data access layer)
 *   - Controller   : QuoteController  (view logic via "controllerAs")
 *
 * @author   Your Name <your@email.com>
 * @version  1.0.0
 * @license  MIT
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────── *
   *  1. MODULE DEFINITION
   * ─────────────────────────────────────────────────────────── */
  angular
    .module("dailyQuoteApp", ["ngAnimate"])
    .constant("SUPABASE_CONFIG", {
      url: "YOUR_SUPABASE_URL",         // ← Replace with your Supabase project URL
      anonKey: "YOUR_SUPABASE_ANON_KEY" // ← Replace with your Supabase anon/public key
    });

  /* ─────────────────────────────────────────────────────────── *
   *  2. SUPABASE SERVICE  (Data Access Layer)
   * ─────────────────────────────────────────────────────────── */
  angular
    .module("dailyQuoteApp")
    .service("SupabaseService", SupabaseService);

  SupabaseService.$inject = ["$q", "SUPABASE_CONFIG"];

  /**
   * SupabaseService
   * Wraps the Supabase JS client and exposes promise-based methods
   * compatible with AngularJS's digest cycle via $q.
   *
   * @param {Object} $q              - AngularJS promise service
   * @param {Object} SUPABASE_CONFIG - Injected configuration constant
   */
  function SupabaseService($q, SUPABASE_CONFIG) {
    const self = this;

    // Initialise the Supabase client (available globally via CDN)
    const _client = supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );

    const TABLE = "quotes";

    /**
     * Fetches the total number of quotes in the database.
     * @returns {Promise<number>}
     */
    self.getCount = function () {
      const deferred = $q.defer();

      _client
        .from(TABLE)
        .select("*", { count: "exact", head: true })
        .then(({ count, error }) => {
          if (error) {
            deferred.reject(error);
          } else {
            deferred.resolve(count);
          }
        });

      return deferred.promise;
    };

    /**
     * Fetches a single random quote by:
     *   1. Getting the total row count
     *   2. Generating a random offset
     *   3. Fetching the row at that offset
     *
     * This approach avoids a full-table scan while remaining simple.
     * For large tables, consider a dedicated Postgres function instead.
     *
     * @returns {Promise<Object>} A single quote object
     */
    self.getRandomQuote = function () {
      const deferred = $q.defer();

      self
        .getCount()
        .then((count) => {
          if (!count || count === 0) {
            deferred.reject(new Error("No quotes found in the database."));
            return;
          }

          const randomOffset = Math.floor(Math.random() * count);

          return _client
            .from(TABLE)
            .select("id, content, author, category")
            .range(randomOffset, randomOffset)
            .single();
        })
        .then((result) => {
          if (!result) return; // already rejected above
          const { data, error } = result;
          if (error) {
            deferred.reject(error);
          } else {
            deferred.resolve(data);
          }
        })
        .catch((err) => deferred.reject(err));

      return deferred.promise;
    };
  }

  /* ─────────────────────────────────────────────────────────── *
   *  3. QUOTE CONTROLLER  (View Logic)
   * ─────────────────────────────────────────────────────────── */
  angular
    .module("dailyQuoteApp")
    .controller("QuoteController", QuoteController);

  QuoteController.$inject = ["$scope", "$timeout", "SupabaseService"];

  /**
   * QuoteController
   * Manages the quote display state, user interactions, and
   * clipboard / share functionality.
   *
   * Uses "controllerAs" syntax (vm = ViewModel).
   *
   * @param {Object} $scope          - AngularJS scope
   * @param {Object} $timeout        - AngularJS $timeout wrapper
   * @param {Object} SupabaseService - Injected data service
   */
  function QuoteController($scope, $timeout, SupabaseService) {
    const vm = this;

    /* ── State ──────────────────────────────────────────────── */
    vm.quote       = null;
    vm.loading     = false;
    vm.error       = null;
    vm.copied      = false;
    vm.totalQuotes = 0;
    vm.showToast   = false;
    vm.toastMessage = "";
    vm.today       = _formatDate(new Date());

    /* ── Public Methods ─────────────────────────────────────── */
    vm.fetchRandomQuote = fetchRandomQuote;
    vm.copyToClipboard  = copyToClipboard;
    vm.shareOnTwitter   = shareOnTwitter;

    /* ── Initialise ─────────────────────────────────────────── */
    activate();

    // ── Private Functions ────────────────────────────────────

    /**
     * Bootstrap: fetch initial quote and total count.
     */
    function activate() {
      _fetchTotalCount();
      fetchRandomQuote();
    }

    /**
     * Fetches a random quote from the Supabase backend.
     * Sets loading / error state accordingly.
     */
    function fetchRandomQuote() {
      vm.loading = true;
      vm.error   = null;

      SupabaseService.getRandomQuote()
        .then(function (quote) {
          vm.quote = quote;
        })
        .catch(function (err) {
          console.error("[QuoteController] Failed to fetch quote:", err);
          vm.error = "Could not load a quote. Please check your connection and try again.";
        })
        .finally(function () {
          vm.loading = false;
        });
    }

    /**
     * Copies the current quote + author to the system clipboard.
     * Displays a toast notification on success.
     */
    function copyToClipboard() {
      if (!vm.quote) return;

      const text = `"${vm.quote.content}" — ${vm.quote.author}`;

      navigator.clipboard
        .writeText(text)
        .then(function () {
          vm.copied = true;
          _showToast("Quote copied to clipboard ✓");

          $timeout(function () {
            vm.copied = false;
          }, 2500);
        })
        .catch(function () {
          _showToast("Copy failed — please try manually.");
        });
    }

    /**
     * Opens a pre-filled Twitter/X share dialog in a new tab.
     */
    function shareOnTwitter() {
      if (!vm.quote) return;

      const tweetText = encodeURIComponent(
        `"${vm.quote.content}" — ${vm.quote.author}\n\n#DailyQuote #Motivation`
      );
      const url = `https://twitter.com/intent/tweet?text=${tweetText}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }

    /**
     * Retrieves and caches the total quote count.
     */
    function _fetchTotalCount() {
      SupabaseService.getCount()
        .then(function (count) {
          vm.totalQuotes = count || 0;
        })
        .catch(function (err) {
          console.warn("[QuoteController] Could not fetch total count:", err);
        });
    }

    /**
     * Displays a toast notification for a given duration.
     * @param {string} message
     * @param {number} [duration=2500]
     */
    function _showToast(message, duration) {
      vm.toastMessage = message;
      vm.showToast    = true;

      $timeout(function () {
        vm.showToast = false;
      }, duration || 2500);
    }

    /**
     * Formats a Date object to a human-readable string.
     * e.g. "Sunday, March 15, 2026"
     * @param   {Date}   date
     * @returns {string}
     */
    function _formatDate(date) {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year:    "numeric",
        month:   "long",
        day:     "numeric"
      });
    }
  }
})();
