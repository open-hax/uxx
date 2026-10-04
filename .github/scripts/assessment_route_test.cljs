;; SPDX-License-Identifier: GPL-3.0-or-later
(ns assessment-route-test
  (:require [cljs.test :as test :refer [deftest is run-tests]]
            [clojure.string :as str]
            [pr-flow.actionability :as a]
            [assessment-route :as r]
            ["node:fs" :as fs] ["node:os" :as os] ["node:path" :as path]))

(def context (js->clj (js/JSON.parse (fs/readFileSync ".github/scripts/fixtures/uxx14-native-context.json" "utf8")) :keywordize-keys true))
(def user {:login "riatzukiza" :id 10676925 :node_id "MDQ6VXNlcjEwNjc2OTI1" :type "User"})
(def policy {:version 1 :status :provisional
             :identities #{{:login "opencode-agent[bot]" :id 219766164 :node-id "BOT_kgDODRldlA"}}})
(defn fixture-comment [id body time actor]
  {:id id :node_id (str "IC_fixture_" id) :user actor :body body
   :created_at time :updated_at time
   :html_url (str "https://github.com/open-hax/uxx/pull/14#issuecomment-" id)})
(def t (r/target context [] policy))
(def proposal (r/native-comment (fixture-comment 7001
                  (str "Actionability proposal v1 for " (:head r/selection) ":\n" (pr-str (a/context-binding t)))
                  "2026-10-04T12:00:00Z" user) true))
(def trigger (fixture-comment 7002
               (str "/opencode assess-actionability " (:head r/selection) " " (:thread r/selection) " comment4172775340 proposal7001")
               "2026-10-04T12:01:00Z" user))
(def event {:action "created" :repository {:full_name "open-hax/uxx" :private false}
            :issue {:number 14 :pull_request {:url "native"}} :comment trigger})
(def base "0602ff3ee1913cc0759d1de7478e9ef5a2e3419c")
(def live-pr {:state "open" :draft false :head {:sha (:head r/selection) :repo {:full_name "open-hax/uxx" :private false}}
              :base {:sha base :repo {:full_name "open-hax/uxx" :private false}}})
(def coverage {:diff-sha256 (r/sha "fixture exact diff") :files [".github/workflows/opencode-code-review.yml"] :diff "fixture exact diff"})
(def intake {:event event :live-pr live-pr :context context :comments [proposal (r/native-comment trigger true)]
             :trigger trigger :authorized? true :policy policy :coverage coverage})
(def snapshot (r/validate-intake! intake))
(defn submission-value [decision]
  {:head (:head r/selection) :diffSha256 (:diff-sha256 coverage) :coveredFiles (:files coverage) :comments []
   :summary (str "Actionability assessment v1 for " (:head r/selection) ":\n"
                 (pr-str (into (a/context-binding (:target snapshot))
                               [7001 (:body-sha256 proposal) decision
                                (if (= "informational" decision) "complete-context/no-defect/no-request/no-question" "scope-incomplete-or-finding")
                                "Fixture decision is synthetic; native review remains required before real admission."
                                ".github/workflows/opencode-code-review.yml:142 fixture source evidence"])) )})
(defn result [value] {:input-sha256 (r/sha (pr-str snapshot)) :runner-sha256 r/runtime-hash :review value})
(defn refuses? [f] (try (f) false (catch :default _ true)))
(defn native-response [value variant]
  ;; Synthetic local transport fixture; never a native assessment attestation.
  #js {:info #js {:role "assistant" :providerID "kimi-code-plan-global" :modelID "kimi-for-coding"
                 :variant variant :structured (clj->js value)}
       :parts #js [#js {:type "tool" :tool "StructuredOutput"
                        :state #js {:status "completed" :input (clj->js value)}}]})
(defn review [decision]
  (js->clj (.parseStructured (r/runtime!) (native-response (submission-value decision) "low")
                            (:head r/selection) #js {:diffSha256 (:diff-sha256 coverage) :coveredFiles (clj->js (:files coverage))})
           :keywordize-keys true))

(deftest reused-runner-enforces-actual-low-request-and-assistant
  (let [runner (r/runtime!) value (submission-value "informational")
        full #js {:diffSha256 (:diff-sha256 coverage) :coveredFiles (clj->js (:files coverage))}
        request (.structuredRequest runner "synthetic local assessment fixture" (:head r/selection) full)
        parsed (js->clj (.parseStructured runner (native-response value "low") (:head r/selection) full) :keywordize-keys true)]
    (is (= "low" (.-variant request)))
    (is (map? (:executionControl parsed)))
    (is (= "low" (get-in parsed [:executionControl :observedAssistantVariant])))
    (is (contains? (:executionControl parsed) :underlyingProviderModel))
    (is (nil? (get-in parsed [:executionControl :underlyingProviderModel])))
    (doseq [variant [nil "max" "none"]]
      (is (refuses? #(.parseStructured runner (native-response value variant) (:head r/selection) full))))))

(deftest reused-native-capability-and-version-guards
  (let [runner (r/runtime!)
        catalog {:connected ["kimi-code-plan-global"]
                 :all [{:id "kimi-code-plan-global"
                        :models {:kimi-for-coding {:id "kimi-for-coding" :capabilities {:reasoning true}
                                                  :api {:npm "@ai-sdk/openai-compatible"}
                                                  :variants {:low {:reasoningEffort "low"}}}}}]}]
    ;; Same public runtime boundary that executeStructured applies before creating a session.
    (is (nil? (.assertLowCapability runner (clj->js catalog))))
    (doseq [bad [(assoc catalog :connected []) (assoc catalog :all [])
                 (assoc-in catalog [:all 0 :models :kimi-for-coding :capabilities :reasoning] false)
                 (update-in catalog [:all 0 :models :kimi-for-coding :variants] dissoc :low)
                 (assoc-in catalog [:all 0 :models :kimi-for-coding :variants :low :reasoningEffort] "max")]]
      (is (refuses? #(.assertLowCapability runner (clj->js bad)))))
    (is (nil? (.assertRuntimeVersion runner "1.18.34")))
    (is (refuses? #(.assertRuntimeVersion runner "1.15.13")))))

(deftest external-runtime-and-dependency-byte-guards
  (let [dir (fs/mkdtempSync (str (os/tmpdir) "/uxx-runtime-wire-"))
        scripts (path/join dir ".github/scripts") saved (aget js/process.env "ASSESSMENT_RUNTIME")
        actual (path/resolve (or saved ".assessment-runtime") ".github/scripts")]
    (fs/mkdirSync scripts #js {:recursive true})
    (try
      (fs/copyFileSync (path/join actual "opencode-app-auth.cjs") (path/join scripts "opencode-app-auth.cjs"))
      (fs/copyFileSync ".github/scripts/kimi-review.cjs" (path/join scripts "kimi-review.cjs"))
      (aset js/process.env "ASSESSMENT_RUNTIME" dir)
      (is (refuses? r/runtime!)) ; old local 95b runner cannot be a fallback
      (fs/copyFileSync (path/join actual "kimi-review.cjs") (path/join scripts "kimi-review.cjs"))
      (fs/appendFileSync (path/join scripts "opencode-app-auth.cjs") "\n// altered dependency\n")
      (is (refuses? r/runtime!))
      (finally
        (if saved (aset js/process.env "ASSESSMENT_RUNTIME" saved) (js-delete js/process.env "ASSESSMENT_RUNTIME"))
        (fs/rmSync dir #js {:recursive true :force true})))))

(deftest artifact-control-survives-and-refuses-missing-or-guessed-controls
  (let [value (review "informational") actual (:executionControl value)]
    (is (= actual (r/execution-control! value)))
    (is (nil? (:underlyingProviderModel actual)))
    (doseq [bad [(dissoc value :executionControl)
                 (update value :executionControl dissoc :underlyingProviderModel)
                 (assoc-in value [:executionControl :underlyingProviderModel] "guessed-backend")
                 (assoc-in value [:executionControl :observedAssistantVariant] "max")
                 (assoc-in value [:executionControl :requested :variant] "none")
                 (assoc-in value [:executionControl :opencodeVersion] "1.15.13")
                 (assoc-in value [:executionControl :executedIdentity :modelID] "other")]]
      (let [effects (atom 0)]
        (is (refuses? #(r/publish! (fn [& _] (swap! effects inc)) snapshot (result bad) (fn [] snapshot))))
        (is (zero? @effects))))))

(defn workflow-guard
  "Execute the actual workflow expression; no handwritten second admission law."
  [job github needs]
  (let [text (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        expression (second (re-find (re-pattern (str "(?s)  " job ":[^\\n]*\\n.*?    if: \\$\\{\\{ (.*?) \\}\\}")) text))
        js-expression (str/replace (or expression "false") "needs.scoped-assessment-read" "needs['scoped-assessment-read']")
        fnc (js/Function. "github" "needs" "startsWith" (str "return (" js-expression ");"))]
    (fnc (clj->js github) (clj->js needs) (fn [value prefix] (str/starts-with? value prefix)))))

(deftest hosted-route-is-enabled
  ;; RED runs against the actual existing workflow, before a transport exists.
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")]
    (is (boolean (re-find #"issue_comment:\s*\n\s*types: \[created\]" workflow)))
    (is (boolean (re-find #"scoped-assessment-read:" workflow)))
    (is (boolean (re-find #"scoped-assessment-publish:" workflow)))))

(deftest actual-enabled-guards
  (let [github {:event_name "issue_comment" :event event}]
    (is (true? (workflow-guard "scoped-assessment-read" github {})))
    (doseq [bad [(assoc github :event_name "workflow_dispatch")
                 (assoc-in github [:event :action] "edited")
                 (assoc-in github [:event :issue :number] 15)
                 (assoc-in github [:event :issue :pull_request] nil)
                 (assoc-in github [:event :comment :user :type] "Bot")
                 (assoc-in github [:event :comment :body] "@opencode generic unrestricted prompt")]]
      (is (false? (workflow-guard "scoped-assessment-read" bad {}))))
    (is (true? (workflow-guard "scoped-assessment-publish" github {:scoped-assessment-read {:result "success"}})))
    (is (false? (workflow-guard "issue-triage" github {})))
    (is (false? (workflow-guard "daily-issue-sweep" github {})))
    (doseq [status ["failure" "cancelled" "skipped"]]
      (is (false? (workflow-guard "scoped-assessment-publish" github {:scoped-assessment-read {:result status}}))))))

(deftest genuine-native-context-and-canonical-law
  (is (= (:context r/selection) (:context-digest t)))
  (is (= :finding (:kind (a/disposition (:target snapshot)))))
  (is (= 7001 (:proposal-id (a/disposition (:target snapshot)))))
  (is (= "opencode-agent[bot]" (:login (first (:identities policy)))))
  (is (= (:context-manifest t) (a/context-manifest (:native-context t))))
  (let [native (js->clj (js/JSON.parse (fs/readFileSync ".github/scripts/fixtures/uxx14-native-comment-metadata.json" "utf8")) :keywordize-keys true)]
    (is (= (:html_url native) (:html_url (fixture-comment (:id native) "fixture" (:created_at native) (:user native)))))))

(defn publisher-check-before-mint?
  "Validate the actual publisher text, including absence of either boundary."
  [publisher]
  (let [check (.indexOf publisher "ASSESSMENT_COMMAND: check")
        mint (.indexOf publisher "withOpenCodeAppToken")]
    (and (<= 0 check) (<= 0 mint) (< check mint))))

(deftest publisher-ordering-rejects-absent-and-reordered-check
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        publisher (second (re-find #"(?s)\n  scoped-assessment-publish:(.*?)(?:\n  [a-z][a-z0-9-]*:|$)" workflow))]
    (is (true? (publisher-check-before-mint? publisher)))
    (is (false? (publisher-check-before-mint?
                 (str/replace publisher "ASSESSMENT_COMMAND: check" "ASSESSMENT_COMMAND: absent"))))
    (is (false? (publisher-check-before-mint?
                 (str/replace publisher "withOpenCodeAppToken" "missing-app-mint"))))
    (is (false? (publisher-check-before-mint?
                 (str "withOpenCodeAppToken\n" publisher))))))

(deftest actual-workflow-separates-model-and-app
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        read-job (or (second (re-find #"(?s)  scoped-assessment-read:(.*?)\n  scoped-assessment-publish:" workflow)) "")
        publisher (or (second (re-find #"(?s)\n  scoped-assessment-publish:(.*?)(?:\n  [a-z][a-z0-9-]*:|$)" workflow)) "")]
    (is (not (str/includes? read-job "id-token:")))
    (is (not (str/includes? read-job "issues: write")))
    (is (str/includes? publisher "id-token: write"))
    (is (not (str/includes? publisher "KIMI_API_KEY")))
    (is (not (str/includes? publisher "Install immutable OpenCode")))
    (is (not (str/includes? publisher "anomalyco/opencode/github")))
    (is (true? (publisher-check-before-mint? publisher)))
    (is (str/includes? publisher "2810f4515424a146fe37390fb0baf532cca31236"))
    (is (= 2 (count (re-seq #"ref: \$\{\{ github.sha \}\}" workflow))))))

(deftest new-jobs-consume-one-qualified-runtime-and-immutable-actions
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        scope (first (str/split (second (str/split workflow #"\n  scoped-assessment-contract:" 2)) #"\n  daily-issue-sweep:" 2))
        uses (re-seq #"uses: ([^\s]+)" scope)
        pins {"actions/checkout" "de0fac2e4500dabe0009e67214ff5f5447ce83dd"
              "actions/setup-node" "49933ea5288caeca8642d1e84afbd3f7d6820020"
              "actions/github-script" "f28e40c7f34bde8b3046d885e986cb6290c5673b"
              "actions/upload-artifact" "ea165f8d65b6e75b540449e92b4886f43607fa02"
              "actions/download-artifact" "d3f86a106a0bac45b974a628896c90dbdf5c8093"}]
    (is (= 3 (count (re-seq #"path: \.assessment-runtime" scope))))
    (is (not (str/includes? scope ".assessment-publisher")))
    (doseq [[_ use] uses]
      (let [[action pin] (str/split use #"@" 2)] (is (= (get pins action) pin))))))

(deftest scoped-jobs-use-the-committed-frozen-runtime
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        scope (second (re-find #"(?s)\n  scoped-assessment-contract:(.*?)\n  daily-issue-sweep:" workflow))]
    (is (= 3 (count (re-seq #"working-directory: \.github/assessment-tools" scope))))
    (is (= 3 (count (re-seq #"npm ci --ignore-scripts --no-audit --no-fund" scope))))
    (is (not (str/includes? scope "npm install")))
    (is (not (str/includes? scope "$RUNNER_TEMP/assessment-tools")))
    (is (str/includes? workflow "'.github/assessment-tools/**'"))))

(deftest contract-diagnostic-has-the-read-job-permissions
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        permissions (fn [job]
                      (second (re-find (re-pattern (str "(?s)  " job ":.*?    permissions:\\n(.*?)    (?:steps|env):")) workflow)))]
    (is (= (permissions "scoped-assessment-contract") (permissions "scoped-assessment-read")))
    (is (= "      contents: read\n      pull-requests: read\n      issues: read\n"
           (permissions "scoped-assessment-contract")))))

(deftest actual-read-token-diagnostic-fails-closed-and-sanitizes
  (test/async done
    (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
          raw (second (re-find #"(?s)      - name: Verify read-token collaborator-permission API.*?          script: \|\n(.*?)(?=\n  scoped-assessment-read:)" workflow))
          script (str/replace (or raw "") #"(?m)^            " "")
          execute (js/Function. "github" "core" (str "return (async () => {\n" script "\n})();"))
          cases [[{:status 200 :data {:permission "admin"}} true]
                 [{:status 200 :data {:permission "none"}} true]
                 [{:status 403 :data {:permission "admin"}} false]
                 [{:status 200 :data {:permission "unknown-permission"}} false]
                 [{:status 200 :data {}} false]
                 [{:throw-status 403} false]
                 [{:throw-status "unknown"} false]]
          probes (mapv
                   (fn [[response succeeds?]]
                     (let [calls (atom []) infos (atom []) failures (atom [])
                           github #js {:rest #js {:repos #js {:getCollaboratorPermissionLevel
                                        (fn [args]
                                          (swap! calls conj (js->clj args :keywordize-keys true))
                                          (if-let [status (:throw-status response)]
                                            (let [error (js/Error. "PRIVATE_ERROR_SENTINEL")]
                                              (aset error "status" status)
                                              (throw error))
                                            (js/Promise.resolve (clj->js response))))}}}
                           core #js {:info #(swap! infos conj %) :setFailed #(swap! failures conj %)}]
                       (.then (execute github core)
                              (fn []
                                (is (= [{:owner "open-hax" :repo "uxx" :username "riatzukiza"}] @calls))
                                (is (= succeeds? (empty? @failures)))
                                (is (= (if succeeds? 1 0) (count @infos)))
                                (is (not (str/includes? (str @infos @failures) "PRIVATE_ERROR_SENTINEL")))))))
                   cases)]
      (-> (js/Promise.all (clj->js probes))
          (.then (fn [_] (done)))
          (.catch (fn [_] (is false "Actual diagnostic script unexpectedly rejected") (done)))))))

(deftest intake-negative-boundaries
  (doseq [bad [(assoc intake :authorized? false)
               (assoc-in intake [:event :repository :full_name] "fork/uxx")
               (assoc-in intake [:event :repository :private] true)
               (assoc-in intake [:live-pr :head :repo :full_name] "fork/uxx")
               (assoc-in intake [:live-pr :base :repo :full_name] "fork/uxx")
               (assoc-in intake [:live-pr :head :repo :private] true)
               (assoc-in intake [:live-pr :head :sha] (apply str (repeat 40 "a")))
               (assoc-in intake [:live-pr :draft] true)
               (assoc-in intake [:live-pr :state] "closed")
               (assoc-in intake [:context :pr :headRefOid] (apply str (repeat 40 "a")))
               (assoc-in intake [:context :thread :isResolved] false)
               (assoc-in intake [:context :thread :comments :nodes 0 :body] "modified native context")
               (assoc-in intake [:trigger :body] "not the native event")
               (assoc-in intake [:trigger :updated_at] "2026-10-04T12:02:00Z")
               (assoc intake :comments [proposal])
               (update-in intake [:comments 0] assoc :authorized? false)
               (update-in intake [:comments 0] assoc :created_at "2026-10-02T00:00:00Z" :updated_at "2026-10-02T00:00:00Z")
               (update-in intake [:comments 0 :body] str "\nextra quoted example")
               (update intake :comments conj (r/native-comment (fixture-comment 7003 "Actionability proposal v1 for 68eeefdca9d840571e2dec911085b782dc5c4ed2:\nmalformed" "2026-10-04T12:02:00Z" user) true))]]
    (is (refuses? #(r/validate-intake! bad))))
  (doseq [body [(str/replace (:body trigger) "comment4172775340" "comment4172778621")
               (str/replace (:body trigger) "proposal7001" "proposal7009")
               (str/replace (:body trigger) (:thread r/selection) "PRRT_other")]]
    (is (refuses? #(r/validate-intake! (-> intake (assoc-in [:trigger :body] body) (assoc-in [:event :comment :body] body)))))))

(deftest complete-pagination-and-errors
  (let [calls (atom []) rows (r/collect-pages! (fn [page] (swap! calls conj page)
                                                     (if (= page 1) (mapv #(hash-map :id %) (range 100)) [{:id 100}])))]
    (is (= 101 (count rows))) (is (= [1 2] @calls)))
  (is (refuses? #(r/collect-pages! (fn [_] nil))))
  (is (refuses? #(r/collect-pages! (fn [_] (mapv (fn [id] {:id id}) (range 100))))))
  (is (refuses? #(r/context! (fn [& _] {:errors [{:message "not an empty catalog"}]}))))
  (let [envelope {:data {:repository (assoc (:repository context) :pullRequest
                                           (assoc (:pr context) :reviewThreads {:nodes [(:thread context)] :pageInfo {:hasNextPage false}}))}}]
    (is (= context (r/context! (fn [& _] envelope))))
    (is (refuses? #(r/context! (fn [& _] (assoc-in envelope [:data :repository :pullRequest :reviewThreads :nodes 0 :comments :pageInfo :hasNextPage] true)))))))

(deftest submission-is-independent-and-exact
  (doseq [decision ["informational" "finding" "uncertain"]]
    (is (= (:summary (review decision)) (r/submission! snapshot (review decision)))))
  (doseq [bad [(assoc (review "informational") :summary "APPROVED")
               (update (review "informational") :summary #(str "```\n" % "\n```"))
               (assoc (review "informational") :coveredFiles [])
               (assoc (review "informational") :diffSha256 (r/sha "different"))
               (assoc (review "informational") :head base)
               (assoc (review "informational") :comments [{:path "a" :line 1 :body "other scope"}])
               (update (review "informational") :summary #(str/replace % (:context r/selection) (r/sha "different")))
               (update (review "informational") :summary #(str/replace % " 7001 " " 7009 "))
               (update (review "informational") :summary #(str/replace % "complete-context/no-defect/no-request/no-question" "incomplete"))]]
    (is (refuses? #(r/submission! snapshot bad)))))

(deftest fresh-final-seam-refuses-mutation-before-publication
  (doseq [current [(assoc-in snapshot [:identity 0 0] 2)
                   (update snapshot :identity conj :new-proposal)
                   (assoc-in snapshot [:identity 4] (apply str (repeat 40 "a")))
                   (assoc-in snapshot [:identity 5 :diff-sha256] (r/sha "after-model mutation"))]]
    (let [posts (atom 0)]
      (is (refuses? #(r/publish! (fn [& _] (swap! posts inc)) snapshot (result (review "informational")) (fn [] current))))
      (is (zero? @posts))))
  (doseq [bad [(assoc (result (review "informational")) :input-sha256 (r/sha "other snapshot"))
               (assoc (result (review "informational")) :runner-sha256 (r/sha "other runner"))
               (assoc-in (result (review "informational")) [:review :coveredFiles] [])]]
    (let [posts (atom 0)]
      (is (refuses? #(r/publish! (fn [& _] (swap! posts inc)) snapshot bad (fn [] snapshot))))
      (is (zero? @posts)))))

(deftest actual-fresh-api-seam-after-model-refuses-changes
  (doseq [mutation [:head :root-body :proposal :diff :writer]]
    (let [state (atom {:pr live-pr :context context :rows [proposal trigger] :coverage coverage :permission "write"}) posts (atom 0)
          api! (fn [method endpoint _]
                 (cond
                   (= endpoint "graphql")
                   {:data {:repository (assoc (:repository (:context @state)) :pullRequest
                                              (assoc (:pr (:context @state)) :reviewThreads
                                                     {:nodes [(:thread (:context @state))] :pageInfo {:hasNextPage false}}))}}
                   (= endpoint "repos/open-hax/uxx/pulls/14") (:pr @state)
                   (= endpoint "repos/open-hax/uxx/issues/comments/7002") trigger
                   (str/includes? endpoint "/comments?") (:rows @state)
                   (str/includes? endpoint "/permission") {:permission (:permission @state)}
                   (= method "POST") (swap! posts inc)
                   :else (throw (js/Error. "Unexpected fixture effect"))))
          current! #(r/live! api! event policy (fn [& _] (:coverage @state)))
          original (current!)]
      (is (= (:identity snapshot) (:identity original)))
      (case mutation
        :head (swap! state assoc-in [:pr :head :sha] base)
        :root-body (swap! state assoc-in [:context :thread :comments :nodes 0 :body] "Changed after first guard")
        :proposal (swap! state update :rows conj (r/native-comment (fixture-comment 7003
                                                    (:body proposal)
                                                    "2026-10-04T12:03:00Z" user) true))
        :diff (swap! state assoc-in [:coverage :diff-sha256] (r/sha "different verified Git diff"))
        :writer (swap! state assoc :permission "read"))
      (is (refuses? #(r/publish! api! original (result (review "informational")) current!)))
      (is (zero? @posts)))))

(def bot {:login "opencode-agent[bot]" :id 219766164 :node_id "BOT_kgDODRldlA" :type "Bot"})
(defn native-seam
  ([decision alter-readback] (native-seam decision alter-readback identity))
  ([decision alter-readback alter-rows]
  (let [body (:summary (review decision)) native (fixture-comment 7004 body "2026-10-04T12:10:00Z" bot)
        calls (atom [])
        api! (fn [method endpoint payload]
               (swap! calls conj [method endpoint payload])
               (cond
                 (= method "POST") (if (= endpoint "graphql")
                                     {:data {:repository (assoc (:repository context) :pullRequest
                                                                  (assoc (:pr context) :reviewThreads {:nodes [(:thread context)] :pageInfo {:hasNextPage false}}))}}
                                     native)
                 (str/includes? endpoint "/issues/comments/") (alter-readback native)
                 (str/includes? endpoint "/comments?") (alter-rows [proposal trigger native])
                 (str/includes? endpoint "/permission") {:permission "write"}
                 (= endpoint "repos/open-hax/uxx/pulls/14") live-pr
                 :else (throw (js/Error. "Unexpected effect"))))]
    {:calls calls :run #(r/publish! api! snapshot (result (review decision)) (fn [] snapshot))})))

(deftest actual-publisher-seam-native-readback-and-classification
  (doseq [decision ["informational" "finding" "uncertain"]]
    (let [{:keys [run calls]} (native-seam decision identity) out (run)]
      (is (= 7004 (:native-id out))) (is (= decision (:decision out)))
      (is (= (:executionControl (review decision)) (:execution-control out)))
      (is (= (if (= "informational" decision) :informational :finding) (get-in out [:disposition :kind])))
      (is (= 1 (count (filter #(= ["POST" "repos/open-hax/uxx/issues/14/comments"] (subvec % 0 2)) @calls))))))
  (doseq [alter [#(assoc-in % [:user :id] 41898282)
                #(assoc-in % [:user :node_id] "BOT_other")
                #(assoc-in % [:user :login] "github-actions[bot]")
                #(assoc-in % [:user :type] "User")
                #(assoc % :node_id nil)
                #(assoc % :id 8000)
                #(assoc % :updated_at "2026-10-04T12:11:00Z")
                #(assoc % :body "changed publication")
                #(assoc % :html_url "https://github.com/other/repo/issues/14#issuecomment-7004")]]
    (is (refuses? (:run (native-seam "informational" alter)))))
  (is (refuses? #(r/validate-intake! (assoc intake :comments
                                         [proposal (r/native-comment (fixture-comment 7004 (:summary (review "uncertain")) "2026-10-04T12:10:00Z" bot) false)])))))

(deftest post-publication-conflicts-refuse-qualification
  (doseq [alter [(fn [rows] (vec (butlast rows)))
                (fn [rows] (vec (remove #(= 7002 (:id %)) rows)))
                (fn [rows] (conj rows (fixture-comment 7005 (:body proposal) "2026-10-04T12:11:00Z" user)))
                (fn [rows] (conj rows (fixture-comment 7006 (:summary (review "finding")) "2026-10-04T12:11:00Z" bot)))]]
    (let [{:keys [run calls]} (native-seam "informational" identity alter)]
      (is (refuses? run))
      (is (= 1 (count (filter #(= ["POST" "repos/open-hax/uxx/issues/14/comments"] (subvec % 0 2)) @calls)))))))

(deftest model-has-no-publisher-credentials-or-mutation-tools
  (let [env (js->clj (r/model-env "/tmp/fixture-home"
                                 {"PATH" "/bin" "KIMI_API_KEY" "synthetic-fixture-only" "GH_TOKEN" "must-not-pass"
                                  "GITHUB_TOKEN" "must-not-pass" "ACTIONS_ID_TOKEN_REQUEST_TOKEN" "must-not-pass"}))
        config (js->clj (js/JSON.parse (get env "OPENCODE_CONFIG_CONTENT")) :keywordize-keys true)]
    (is (= "synthetic-fixture-only" (get env "KIMI_API_KEY")))
    (doseq [key ["GH_TOKEN" "GITHUB_TOKEN" "ACTIONS_ID_TOKEN_REQUEST_TOKEN" "ACTIONS_ID_TOKEN_REQUEST_URL"]]
      (is (not (contains? env key))))
    (is (= "deny" (get-in config [:permission :*])))
    (is (= "deny" (get-in config [:permission :external_directory])))
    (is (= #{:* :read :glob :grep :StructuredOutput :external_directory} (set (keys (:permission config)))))
    (is (= 24 (get-in config [:agent :kimi-reviewer :steps]))))
  (let [runner (r/runtime!) value (clj->js (review "informational"))]
    ;; Actual reused native runner rejects a hand-authored review with no completed tool proof.
    (is (refuses? #(.parseStructured runner #js {:info #js {:role "assistant" :providerID "kimi-code-plan-global"
                                                          :modelID "kimi-for-coding" :structured value} :parts #js []}
                                    (:head r/selection) #js {:diffSha256 (:diff-sha256 coverage) :coveredFiles (clj->js (:files coverage))})))))

(deftest model-child-consumes-only-allowed-real-node-environment
  (let [settings {"PATH" "/synthetic/fixture/bin" "LANG" "C.fixture" "TMPDIR" "/synthetic/fixture/tmp"
                  "KIMI_API_KEY" "synthetic-fixture-only" "GH_TOKEN" "synthetic-must-not-pass"
                  "GITHUB_TOKEN" "synthetic-must-not-pass" "ACTIONS_ID_TOKEN_REQUEST_TOKEN" "synthetic-must-not-pass"
                  "ACTIONS_ID_TOKEN_REQUEST_URL" "synthetic-must-not-pass"}
        previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))]
    (try
      (doseq [[k v] settings] (aset js/process.env k v))
      (let [env (js->clj (r/model-env "/synthetic/fixture/home"))]
        (doseq [key ["PATH" "LANG" "TMPDIR" "KIMI_API_KEY"]]
          (is (= (get settings key) (get env key))))
        (doseq [key ["GH_TOKEN" "GITHUB_TOKEN" "ACTIONS_ID_TOKEN_REQUEST_TOKEN" "ACTIONS_ID_TOKEN_REQUEST_URL"]]
          (is (not (contains? env key))))
        (is (= "/synthetic/fixture/home" (get env "HOME"))))
      (finally
        (doseq [[k v] previous]
          (if (nil? v) (js-delete js/process.env k) (aset js/process.env k v)))))))

(deftest intake-entrypoint-consumes-real-node-environment
  ;; process.env is a native Node object, not the plain JS map used by fixtures.
  ;; Keep the actual entrypoint and filesystem write; replace only native reads.
  (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-intake-env-"))
        input (path/join directory "input.edn")
        settings {"ASSESSMENT_COMMAND" "intake" "ASSESSMENT_POLICY" "fixture-policy"
                  "GITHUB_EVENT_PATH" "fixture-native-event.json" "ASSESSMENT_INPUT" input
                  "ASSESSMENT_RESULT" (path/join directory "result.edn")}
        previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
        calls (atom []) value {:captured "native-input-fixture"}]
    (try
      (doseq [[k v] settings] (aset js/process.env k v))
      (let [failure (try
                      (with-redefs [r/policy! (fn [file] (swap! calls conj [:policy file]) policy)
                                    r/read-bounded (fn [file] (swap! calls conj [:event file]) "{}")
                                    r/live! (fn [_ event actual-policy _]
                                              (swap! calls conj [:native event actual-policy]) value)]
                        (r/main!))
                      nil
                      (catch :default e (ex-message e)))]
        (is (nil? failure))
        (is (= [[:policy "fixture-policy"] [:event "fixture-native-event.json"]
                [:native {} policy]] @calls))
        (is (fs/existsSync input))
        (when (fs/existsSync input) (is (= (pr-str value) (fs/readFileSync input "utf8")))))
      (finally
        (doseq [[k v] previous]
          (if (nil? v) (js-delete js/process.env k) (aset js/process.env k v)))
        (fs/rmSync directory #js {:recursive true :force true})))))

(defmethod test/report [:cljs.test/default :end-run-tests] [summary]
  (when (pos? (+ (:fail summary) (:error summary))) (set! (.-exitCode js/process) 1)))
(run-tests)
