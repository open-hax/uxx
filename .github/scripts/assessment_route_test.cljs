;; SPDX-License-Identifier: GPL-3.0-or-later
(ns assessment-route-test
  (:require [cljs.test :as test :refer [deftest is run-tests async]]
            [clojure.edn :as edn]
            [clojure.string :as str]
            [pr-flow.actionability :as a]
            [assessment-route :as r]
            ["node:fs" :as fs] ["node:os" :as os] ["node:path" :as path]
            ["node:child_process" :as cp]))

(def context (js->clj (js/JSON.parse (fs/readFileSync ".github/scripts/fixtures/uxx14-native-context.json" "utf8")) :keywordize-keys true))
(def user {:login "riatzukiza" :id 10676925 :node_id "MDQ6VXNlcjEwNjc2OTI1" :type "User"})
(def policy {:version 1 :status :provisional
             :identities #{{:login "opencode-agent[bot]" :id 219766164 :node-id "BOT_kgDODRldlA"}}})
(defn fixture-comment [id body time actor]
  {:id id :node_id (str "IC_fixture_" id) :user actor :body body
   :created_at time :updated_at time
   :html_url (str "https://github.com/open-hax/uxx/pull/14#issuecomment-" id)})
(def head (get-in context [:pr :headRefOid]))
(def t (r/target context [] policy))
(def proposal (r/native-comment (fixture-comment 7001
                  (str "Actionability proposal v1 for " head ":\n" (pr-str (a/context-binding t)))
                  "2026-10-04T12:00:00Z" user) true))
(def trigger (fixture-comment 7002
               (str "/opencode assess-actionability " head " " (:thread r/selection) " comment4172775340 proposal7001")
               "2026-10-04T12:01:00Z" user))
(def event {:action "created" :repository {:full_name "open-hax/uxx" :private false}
            :issue {:number 14 :pull_request {:url "native"}} :comment trigger})
(def base "0602ff3ee1913cc0759d1de7478e9ef5a2e3419c")
(def main-sha "53966d08c022f17b288e724c0492d09cd7e39641")
(def repo {:full_name "open-hax/uxx" :private false :id (get-in context [:repository :databaseId])
           :node_id (get-in context [:repository :id])})
(def live-branch {:ref "refs/heads/main" :node_id "REF_fixture_main"
                  :object {:type "commit" :sha main-sha
                           :url (str "https://api.github.com/repos/open-hax/uxx/git/commits/" main-sha)}})
(def live-pr {:number 14 :node_id (get-in context [:pr :id]) :state "open" :draft false
              :head {:sha head :repo repo}
              :base {:sha base :ref "main" :repo repo}})
(def coverage {:diff-sha256 (r/sha "fixture exact diff") :files [".github/workflows/opencode-code-review.yml"] :diff "fixture exact diff"})
(def intake {:event event :live-pr live-pr :context context :comments [proposal (r/native-comment trigger true)]
             :trigger trigger :authorized? true :policy policy :coverage coverage :live-base live-branch})
(def snapshot (r/validate-intake! intake))
(defn submission-value [decision]
  {:head head :diffSha256 (:diff-sha256 coverage) :coveredFiles (:files coverage) :comments []
   :summary (str "Actionability assessment v1 for " head ":\n"
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
                            head #js {:diffSha256 (:diff-sha256 coverage) :coveredFiles (clj->js (:files coverage))})
           :keywordize-keys true))

(deftest reused-runner-enforces-actual-low-request-and-assistant
  (let [runner (r/runtime!) value (submission-value "informational")
        full #js {:diffSha256 (:diff-sha256 coverage) :coveredFiles (clj->js (:files coverage))}
        request (.structuredRequest runner "synthetic local assessment fixture" head full)
        parsed (js->clj (.parseStructured runner (native-response value "low") head full) :keywordize-keys true)]
    (is (= "low" (.-variant request)))
    (is (map? (:executionControl parsed)))
    (is (= "low" (get-in parsed [:executionControl :observedAssistantVariant])))
    (is (contains? (:executionControl parsed) :underlyingProviderModel))
    (is (nil? (get-in parsed [:executionControl :underlyingProviderModel])))
    (doseq [variant [nil "max" "none"]]
      (is (refuses? #(.parseStructured runner (native-response value variant) head full))))))

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

(deftest actual-coverage-matches-pinned-helper-for-renames-and-utf8-binary
  (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-coverage-"))
        original (.cwd js/process)
        runner (r/runtime!) saved-runtime (aget js/process.env "ASSESSMENT_RUNTIME")
        runtime-directory (path/resolve (or saved-runtime ".assessment-runtime"))
        git! (fn [& args]
               (str/trim (cp/execFileSync "git" (clj->js args)
                                         #js {:cwd directory :encoding "utf8" :stdio #js ["ignore" "pipe" "pipe"]})))
        commit! (fn []
                  (git! "add" ".")
                  (git! "-c" "core.hooksPath=/dev/null" "-c" "commit.gpgsign=false"
                        "-c" "user.name=Local coverage fixture" "-c" "user.email=fixture@example.invalid"
                        "commit" "-qm" "disposable local coverage fixture")
                  (git! "rev-parse" "HEAD"))
        failure! (fn [base head]
                   (try (r/coverage! base head) ""
                        (catch :default error (ex-message error))))]
    (try
      (git! "init" "-q")
      (git! "config" "diff.renames" "true")
      ;; Fetch in the real coverage! path uses this local fixture, never GitHub.
      (git! "remote" "add" "origin" directory)
      (fs/writeFileSync (path/join directory "before.txt") "unchanged rename content\n")
      (fs/writeFileSync (path/join directory "binary.txt") "before α\u0000\n")
      (let [base (commit!)]
        (fs/renameSync (path/join directory "before.txt") (path/join directory "after.txt"))
        (fs/writeFileSync (path/join directory "binary.txt") "after β\u0000\n")
        (let [head (commit!)]
          (aset js/process.env "ASSESSMENT_RUNTIME" runtime-directory)
          (.chdir js/process directory)
          (let [expected (.diffCoverage runner base head)
                bare (cp/execFileSync "git" #js ["diff" (str base "..." head)] #js {:encoding "utf8"})
                observed (try {:value (r/coverage! base head)}
                              (catch :default error {:failure (ex-message error)}))]
            (is (str/includes? bare "rename from before.txt"))
            (is (str/includes? bare "Binary files"))
            (is (not= bare (.-diff expected)))
            (is (= ["after.txt" "before.txt" "binary.txt"] (js->clj (.-coveredFiles expected))))
            (is (nil? (:failure observed)) (:failure observed))
            (when-let [actual (:value observed)]
              (is (= (.-diff expected) (:diff actual)))
              (is (= (.-diffSha256 expected) (:diff-sha256 actual)))
              (is (= (js->clj (.-coveredFiles expected)) (:files actual)))
              (is (str/includes? (:diff actual) "after β\u0000"))))
          ;; Keep the actual decoder, path guard and prompt-size guard in use.
          (fs/writeFileSync (path/join directory "binary.txt") (js/Buffer.from #js [255 0 10]))
          (is (re-find #"not valid for encoding utf-8" (failure! base (commit!))))
          (fs/writeFileSync (path/join directory "binary.txt") "valid UTF8 again\n")
          (fs/writeFileSync (path/join directory ".env") "synthetic fixture only\n")
          (is (re-find #"sensitive changed paths" (failure! base (commit!))))
          (fs/unlinkSync (path/join directory ".env"))
          (fs/writeFileSync (path/join directory "binary.txt")
                            (str "\u0000" (str/join (repeat (* 1100 1024) "x"))))
          (is (= "Full diff exceeds scoped prompt budget" (failure! base (commit!))))))
      (finally
        (.chdir js/process original)
        (if saved-runtime (aset js/process.env "ASSESSMENT_RUNTIME" saved-runtime)
            (js-delete js/process.env "ASSESSMENT_RUNTIME"))
        (fs/rmSync directory #js {:recursive true :force true})))))

(defn workflow-value [text github needs steps]
  ;; Evaluate the real artifact expressions, including dashed output names.
  (str/replace (or text "") #"\$\{\{ (.*?) \}\}"
               (fn [[_ expression]]
                 (let [expression (str/replace expression #"\.([a-zA-Z0-9_-]+)" "['$1']")
                       evaluate (js/Function. "github" "needs" "steps" (str "return (" expression ");"))]
                   (or (evaluate (clj->js github) (clj->js needs) (clj->js steps)) "")))))

(deftest publisher-downloads-successful-producer-artifact-across-attempts
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        reader (second (re-find #"(?s)\n  scoped-assessment-read:(.*?)\n  scoped-assessment-publish:" workflow))
        publisher (second (re-find #"(?s)\n  scoped-assessment-publish:(.*?)(?:\n  [a-z][a-z0-9-]*:|$)" workflow))
        output (second (re-find #"(?m)^    outputs:\n      artifact-name: ([^\n]+)" reader))
        producer (re-find #"(?s)      - name: Record producer artifact name\n        id: assessment-artifact\n        env:\n          ASSESSMENT_ARTIFACT_NAME: ([^\n]+)\n        run: ([^\n]+)" reader)
        upload (second (re-find #"(?s)uses: actions/upload-artifact@[^\n]+\n        with:\n          name: ([^\n]+)" reader))
        download (second (re-find #"(?s)uses: actions/download-artifact@[^\n]+\n        with:\n          name: ([^\n]+)" publisher))
        requirement (re-find #"(?s)      - name: Require successful producer artifact name\n        env:\n          ASSESSMENT_ARTIFACT_NAME: ([^\n]+)\n        run: ([^\n]+)" publisher)
        directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-artifact-output-"))]
    (try
      (is (= "${{ steps.assessment-artifact.outputs.name }}" output))
      (is (= "${{ steps.assessment-artifact.outputs.name }}" upload))
      (is (= "${{ needs.scoped-assessment-read.outputs.artifact-name }}" download))
      (is (some? producer))
      (is (some? requirement))
      (doseq [[producer-attempt consumer-attempt] [[1 2] [2 2]]]
        (let [github {:run_id 12345 :run_attempt producer-attempt}
              file (path/join directory (str "output-" producer-attempt))
              name (workflow-value (second producer) github {} {})
              _ (when producer
                  (cp/execFileSync "bash" #js ["-e" "-c" (nth producer 2)]
                                   #js {:env #js {:ASSESSMENT_ARTIFACT_NAME name :GITHUB_OUTPUT file}}))
              emitted (if (fs/existsSync file)
                        (second (re-find #"(?m)^name=(.*)$" (fs/readFileSync file "utf8"))) "")
              steps {:assessment-artifact {:outputs {:name emitted}}}
              uploaded (workflow-value upload github {} steps)
              produced-output (workflow-value output github {} steps)
              needs {:scoped-assessment-read {:result "success" :outputs {:artifact-name produced-output}}}
              consumer {:run_id 12345 :run_attempt consumer-attempt}]
          (is (= (str "scoped-assessment-12345-" producer-attempt) emitted))
          (is (= emitted uploaded produced-output))
          (is (= uploaded (workflow-value download consumer needs {})))
          (when requirement
            (is (not (refuses? #(cp/execFileSync "bash" #js ["-e" "-c" (nth requirement 2)]
                                               #js {:env #js {:ASSESSMENT_ARTIFACT_NAME
                                                             (workflow-value (second requirement) consumer needs {})}})))))))
      (let [github {:run_id 12345 :run_attempt 2}
            missing {:scoped-assessment-read {:result "success" :outputs {}}}]
        (is (= "" (workflow-value download github missing {})))
        (when requirement
          (is (refuses? #(cp/execFileSync "bash" #js ["-e" "-c" (nth requirement 2)]
                                        #js {:env #js {:ASSESSMENT_ARTIFACT_NAME
                                                      (workflow-value (second requirement) github missing {})}})))))
      (finally (fs/rmSync directory #js {:recursive true :force true})))))

(defn workflow-concurrency [github]
  ;; Execute the configured group expression, not GitHub's scheduling behavior.
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        expression (second (re-find #"(?m)^  group: \$\{\{ (.*?) \}\}$" workflow))
        evaluate (js/Function. "github" "startsWith" "format"
                              (str "return (" (or expression "null") ");"))]
    (evaluate (clj->js github)
              (fn [value prefix] (str/starts-with? value prefix))
              (fn [template value] (str/replace template "{0}" (str value))))))

(deftest eligible-workflow-holds-reader-and-publisher-together
  (let [workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        reader-guard (second (re-find #"(?s)\n  scoped-assessment-read:.*?    if: \$\{\{ (.*?) \}\}" workflow))
        group-guard (second (re-find #"(?m)^  group: \$\{\{ \((.*?)\) && 'opencode-kimi-assessment-14' \|\| format\('opencode-kimi-assessment-14-ineligible-\{0\}', github.run_id\) \}\}$" workflow))
        github {:event_name "issue_comment" :event event :run_id "101"}]
    ;; One root lock spans the read job and its separate App publisher.
    (is (= 1 (count (re-seq #"(?m)^concurrency:$" workflow))))
    (is (= reader-guard group-guard))
    (is (not (re-find #"(?m)^    concurrency:" workflow)))
    (is (= 1 (count (re-seq #"(?m)^  cancel-in-progress: false$" workflow))))
    (is (not (re-find #"(?m)^\s*queue:" workflow)))
    (is (boolean (re-find #"(?s)\n  scoped-assessment-publish:.*?    needs: scoped-assessment-read\n" workflow)))
    (is (= "opencode-kimi-assessment-14" (workflow-concurrency github)))
    (is (= "opencode-kimi-assessment-14" (workflow-concurrency (assoc github :run_id "102"))))
    (is (true? (workflow-guard "scoped-assessment-read" github {})))
    (is (true? (workflow-guard "scoped-assessment-publish" github {:scoped-assessment-read {:result "success"}})))
    ;; Ineligible events cannot replace an eligible pending workflow. This
    ;; verifies configuration; it claims neither backlog retention nor order.
    (doseq [excluded [(assoc github :event_name "pull_request")
                      (assoc github :event_name "workflow_dispatch")
                      (assoc github :event_name "schedule")
                      (assoc github :event_name "issues")
                      (assoc-in github [:event :action] "edited")
                      (assoc-in github [:event :action] "deleted")
                      (assoc-in github [:event :issue :number] 15)
                      (assoc-in github [:event :issue :pull_request] nil)
                      (assoc-in github [:event :comment :user :type] "Bot")
                      (assoc-in github [:event :comment :body] "ordinary discussion")
                      (assoc-in github [:event :comment :body] "/opencode assess-actionability")
                      (assoc-in github [:event :comment :body] " /opencode assess-actionability old")]]
      (is (false? (workflow-guard "scoped-assessment-read" excluded {})))
      (is (false? (workflow-guard "scoped-assessment-publish" excluded {:scoped-assessment-read {:result "skipped"}})))
      (is (= "opencode-kimi-assessment-14-ineligible-101" (workflow-concurrency excluded)))
      (is (= "opencode-kimi-assessment-14-ineligible-102"
             (workflow-concurrency (assoc excluded :run_id "102")))))
    ;; Dispatch and PR event shapes lack comment fields; short-circuiting keeps
    ;; them in unique groups without attempting the command-prefix read.
    (doseq [other [{:event_name "workflow_dispatch" :event {} :run_id "103"}
                  {:event_name "pull_request" :event {:action "opened"} :run_id "103"}]]
      (is (= "opencode-kimi-assessment-14-ineligible-103" (workflow-concurrency other))))))

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
  (is (= "034ecce657d6b6129050350878820c68e16fde116d4c542849f69f21ae343721" (:context-digest t)))
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
               (update (review "informational") :summary #(str/replace % (:context-digest t) (r/sha "different")))
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
                   (= endpoint "repos/open-hax/uxx/git/ref/heads/main") live-branch
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
                 (= endpoint "repos/open-hax/uxx/git/ref/heads/main") live-branch
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
                                    head #js {:diffSha256 (:diff-sha256 coverage) :coveredFiles (clj->js (:files coverage))})))))

(deftest actual-model-caller-excludes-publisher-credentials
  (async done
    (let [settings {"KIMI_API_KEY" "synthetic-fixture-only" "GH_TOKEN" "synthetic-must-not-pass"
                    "GITHUB_TOKEN" "synthetic-must-not-pass" "ACTIONS_ID_TOKEN_REQUEST_TOKEN" "synthetic-must-not-pass"
                    "ACTIONS_ID_TOKEN_REQUEST_URL" "synthetic-must-not-pass"}
          previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
          seen (atom nil) refusal (js/Error. "fixture stops before model execution")
          runner #js {:reviewConfig (fn [] #js {})
                      :assertRuntimeVersion (fn [version] (is (= "fixture-version" version)))
                      :sourceSnapshot (fn [& _])
                      :executeStructured (fn [_ env workspace head _]
                                           (reset! seen {:env env :workspace workspace :head head})
                                           (js/Promise.reject refusal))}
          restore! #(doseq [[k v] previous]
                      (if (nil? v) (js-delete js/process.env k) (aset js/process.env k v)))]
      (doseq [[k v] settings] (aset js/process.env k v))
      (try
        (let [result (with-redefs [r/runtime! (constantly runner)
                                  r/opencode-version! (constantly "fixture-version")]
                       (r/model! {:target {:head head} :coverage coverage :base (apply str (repeat 40 "b"))}))]
          (-> result
              (.then (fn [_] (is false "Fixture must stop before model output")))
              (.catch (fn [error]
                        (is (identical? refusal error))
                        (is (= head (:head @seen)))
                        (is (= "synthetic-fixture-only" (aget (:env @seen) "KIMI_API_KEY")))
                        (doseq [key ["GH_TOKEN" "GITHUB_TOKEN" "ACTIONS_ID_TOKEN_REQUEST_TOKEN" "ACTIONS_ID_TOKEN_REQUEST_URL"]]
                          (is (nil? (aget (:env @seen) key))))
                        (is (not (fs/existsSync (path/dirname (:workspace @seen)))))))
              (.finally (fn [] (restore!) (done)))))
        (catch :default error
          (restore!) (is false (ex-message error)) (done))))))

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

(defn scoped-fixture [current-head]
  ;; A synthetic successor observation; no native current-head attestation.
  (let [native (-> context (assoc-in [:pr :headRefOid] current-head)
                   (update-in [:thread :comments :nodes]
                              #(mapv (fn [c] (assoc-in c [:commit :oid] current-head)) %)))
        target (r/target native [] policy)
        p (r/native-comment (fixture-comment 7101
              (str "Actionability proposal v1 for " current-head ":\n" (pr-str (a/context-binding target)))
              "2026-10-04T12:00:00Z" user) true)
        trigger (fixture-comment 7102
                  (str "/opencode assess-actionability " current-head " " (:thread r/selection)
                       " comment4172775340 proposal7101") "2026-10-04T12:01:00Z" user)
        diff (str "synthetic exact successor diff for " current-head)]
    {:context native :live-pr (assoc-in live-pr [:head :sha] current-head)
     :live-base live-branch :comments [p (r/native-comment trigger true)]
     :trigger trigger :authorized? true :policy policy
     :event (assoc event :comment trigger)
     :coverage {:diff diff :diff-sha256 (r/sha diff) :files (:files coverage)}}))

(defn scoped-api [state calls posts after-readback]
  (fn [method endpoint payload]
    (swap! calls conj [method endpoint])
    (cond
      (= endpoint "graphql")
      {:data {:repository (assoc (:repository (:context @state)) :pullRequest
                                 (assoc (:pr (:context @state)) :reviewThreads
                                        {:nodes [(:thread (:context @state))] :pageInfo {:hasNextPage false}}))}}
      (= endpoint "repos/open-hax/uxx/pulls/14") (:live-pr @state)
      (= endpoint "repos/open-hax/uxx/git/ref/heads/main") (:live-base @state)
      (= endpoint "repos/open-hax/uxx/issues/comments/7102") (:trigger @state)
      (str/includes? endpoint "/comments?") (:comments @state)
      (str/includes? endpoint "/permission") {:permission "write"}
      (= [method endpoint] ["POST" "repos/open-hax/uxx/issues/14/comments"])
      (let [native (fixture-comment 7104 (:body payload) "2026-10-04T12:10:00Z" bot)]
        (swap! posts inc) (swap! state assoc :published native)
        (swap! state update :comments conj native) native)
      (= endpoint "repos/open-hax/uxx/issues/comments/7104")
      (let [native (:published @state)] (swap! state after-readback) native)
      :else (throw (js/Error. "Unexpected scoped fixture API call")))))

(defn scoped-review [input]
  (let [current-head (get-in input [:target :head]) c (:coverage input) p (:proposal input)
        value {:head current-head :diffSha256 (:diff-sha256 c) :coveredFiles (:files c) :comments []
               :summary (str "Actionability assessment v1 for " current-head ":\n"
                             (pr-str (into (a/context-binding (:target input))
                                           [(:id p) (:body-sha256 p) "informational"
                                            "complete-context/no-defect/no-request/no-question"
                                            "Synthetic fixture only; no native actionability or approval evidence."
                                            ".github/scripts/assessment_route.cljs synthetic successor fixture"])))}]
    (js->clj (.parseStructured (r/runtime!) (native-response value "low") current-head
                              #js {:diffSha256 (:diff-sha256 c) :coveredFiles (clj->js (:files c))})
             :keywordize-keys true)))

(defn advance-main [fixture]
  (let [sha (apply str (repeat 40 "8"))]
    (-> fixture (assoc-in [:live-base :object :sha] sha)
        (assoc-in [:live-base :object :url]
                  (str "https://api.github.com/repos/open-hax/uxx/git/commits/" sha)))))

(deftest current-successor-head-and-live-main-base-bind-the-immutable-input
  (let [successor (apply str (repeat 40 "7")) fixture (scoped-fixture successor)
        state (atom fixture) calls (atom []) posts (atom 0) git-inputs (atom [])
        api! (scoped-api state calls posts identity)
        observed (try {:input (r/live! api! (:event fixture) policy
                                       (fn [base head] (swap! git-inputs conj [base head]) (:coverage fixture)))}
                      (catch :default error {:failure (ex-message error)}))
        input (:input observed)]
    (is (= successor (:head (r/target (:context fixture) [] policy))))
    (is (nil? (:failure observed)) (:failure observed))
    (is (= [[main-sha successor]] @git-inputs))
    (is (= successor (get-in input [:target :head])))
    (is (= main-sha (:base input)))
    (is (= (:base live-pr) (:cached-pr-base input)))
    (is (= base (get-in input [:cached-pr-base :sha])))
    (is (= live-branch (:live-base input)))
    (is (some #{live-branch} (:identity input)))
    (is (some #{(select-keys (:base live-pr) [:ref :sha])} (:identity input)))
    (is (some #{["GET" "repos/open-hax/uxx/git/ref/heads/main"]} @calls))
    (is (zero? @posts))
    (when input
      (let [review (scoped-review input)]
        (is (= (:summary review) (r/submission! input review)))
        (is (str/includes? (r/prompt input) (str "Head: " successor)))
        (is (refuses? #(r/submission! input (assoc review :head head))))))))

(deftest scoped-current-head-base-and-native-identity-refusals
  (let [fixture (scoped-fixture (apply str (repeat 40 "7")))]
    (doseq [bad [(assoc fixture :trigger trigger :event event :comments [proposal (r/native-comment trigger true)])
                 (assoc-in fixture [:live-pr :base :ref] "staging")
                 (assoc-in fixture [:live-pr :head :sha] "malformed")
                 (assoc-in fixture [:live-pr :base :sha] "malformed")
                 (assoc-in fixture [:live-base :ref] "refs/heads/staging")
                 (assoc-in fixture [:live-base :object :sha] "malformed")
                 (assoc-in fixture [:live-base :object :type] "tag")
                 (assoc-in fixture [:live-base :object :url] "https://api.github.com/repos/other/uxx/git/commits/foreign")
                 (assoc-in fixture [:live-base :node_id] nil)
                 (assoc-in fixture [:live-pr :number] 15)
                 (assoc-in fixture [:live-pr :node_id] "PR_other")
                 (assoc-in fixture [:live-pr :head :repo :full_name] "fork/uxx")
                 (assoc-in fixture [:live-pr :base :repo :private] true)
                 (assoc-in fixture [:live-pr :head :repo :id] 1)
                 (assoc-in fixture [:context :repository :id] "R_other")
                 (assoc-in fixture [:context :pr :number] 15)
                 (assoc-in fixture [:context :thread :id] "PRRT_other")
                 (assoc-in fixture [:context :thread :comments :nodes 0 :databaseId] 1)]]
      (is (refuses? #(r/validate-intake! bad)))))
  ;; Main advancing while the real live collector runs also fails closed.
  (let [fixture (scoped-fixture head) state (atom fixture) posts (atom 0)
        api! (scoped-api state (atom []) posts identity)]
    (is (refuses? #(r/live! api! (:event fixture) policy
                           (fn [& _]
                             (swap! state advance-main)
                             (:coverage fixture)))))
    (is (zero? @posts))))

(deftest successor-publication-requires-its-own-current-context-and-submission
  (let [successor (apply str (repeat 40 "7")) fixture (scoped-fixture successor)
        state (atom fixture) calls (atom []) posts (atom 0)
        api! (scoped-api state calls posts identity)
        current! #(r/live! api! (:event fixture) policy (fn [& _] (:coverage fixture)))
        observed (try {:input (current!)} (catch :default error {:failure (ex-message error)}))]
    (is (nil? (:failure observed)) (:failure observed))
    (when-let [original (:input observed)]
      (let [review (scoped-review original)
            result {:input-sha256 (r/sha (pr-str original)) :runner-sha256 r/runtime-hash :review review}
            output (r/publish! api! original result current!)]
        (is (= 1 @posts))
        (is (= 7104 (:native-id output)))
        (is (= :qualified (get-in output [:disposition :status])))
        (is (str/starts-with? (:body (:published @state))
                             (str "Actionability assessment v1 for " successor ":")))))))

(deftest live-main-drift-refuses-actual-model-check-and-post-entrypoints
  (let [fixture (scoped-fixture head) state (atom fixture) calls (atom []) posts (atom 0)
        api! (scoped-api state calls posts identity)
        current! #(r/live! api! (:event fixture) policy (fn [& _] (:coverage fixture)))
        original (current!) review (scoped-review original)
        result {:input-sha256 (r/sha (pr-str original)) :runner-sha256 r/runtime-hash :review review}
        directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-live-base-"))
        input-file (path/join directory "input.edn") result-file (path/join directory "result.edn")
        event-file (path/join directory "event.json")
        settings {"ASSESSMENT_POLICY" "fixture-policy" "ASSESSMENT_INPUT" input-file
                  "ASSESSMENT_RESULT" result-file "GITHUB_EVENT_PATH" event-file}
        previous (into {} (for [k (conj (vec (keys settings)) "ASSESSMENT_COMMAND")]
                            [k (aget js/process.env k)])) model-calls (atom 0)]
    (try
      (fs/writeFileSync input-file (pr-str original)) (fs/writeFileSync result-file (pr-str result))
      (fs/writeFileSync event-file (js/JSON.stringify (clj->js (:event fixture))))
      (doseq [[k v] settings] (aset js/process.env k v))
      (swap! state assoc-in [:live-base :object :sha] (apply str (repeat 40 "8")))
      (swap! state assoc-in [:live-base :object :url]
             (str "https://api.github.com/repos/open-hax/uxx/git/commits/" (apply str (repeat 40 "8"))))
      (doseq [mode ["model" "check"]]
        (aset js/process.env "ASSESSMENT_COMMAND" mode)
        (is (refuses? #(with-redefs [r/policy! (fn [_] policy) r/gh-api! api!
                                    r/coverage! (fn [& _] (:coverage fixture))
                                    r/model! (fn [_] (swap! model-calls inc)
                                               (throw (js/Error. "Fixture stops before any model")))]
                        (r/main!)))))
      (is (zero? @model-calls))
      (is (refuses? #(r/publish! api! original result current!)))
      (is (zero? @posts))
      (finally
        (doseq [[k v] previous]
          (if v (aset js/process.env k v) (js-delete js/process.env k)))
        (fs/rmSync directory #js {:recursive true :force true})))))

(deftest post-readback-refreshes-actual-main-branch-and-cached-metadata
  (doseq [alter [identity
                advance-main
                #(assoc-in % [:live-base :ref] "refs/heads/staging")
                #(assoc-in % [:live-pr :base :sha] (apply str (repeat 40 "9")))
                #(assoc-in % [:live-pr :head :sha] (apply str (repeat 40 "7")))]]
    (let [fixture (scoped-fixture head) state (atom fixture) calls (atom []) posts (atom 0)
          api! (scoped-api state calls posts alter)
          current! #(r/live! api! (:event fixture) policy (fn [& _] (:coverage fixture)))
          original (current!) review (scoped-review original)
          result {:input-sha256 (r/sha (pr-str original)) :runner-sha256 r/runtime-hash :review review}
          observed (try {:output (r/publish! api! original result current!)}
                        (catch :default error {:failure (ex-message error)}))]
      (is (= 1 @posts))
      (if (identical? identity alter)
        (do (is (nil? (:failure observed)) (:failure observed))
            (is (= 7104 (get-in observed [:output :native-id])))
            (is (= :qualified (get-in observed [:output :disposition :status]))))
        (is (some? (:failure observed))))
      (is (some #{["GET" "repos/open-hax/uxx/git/ref/heads/main"]}
                (drop-while #(not= ["GET" "repos/open-hax/uxx/issues/comments/7104"] %) @calls))))))

(deftest actual-successor-model-caller-uses-snapshot-head-and-live-base
  (async done
    (let [successor (apply str (repeat 40 "7")) seen (atom nil)
          runner #js {:reviewConfig (fn [] #js {}) :assertRuntimeVersion (fn [_])
                      :sourceSnapshot (fn [head _ base] (reset! seen {:source-head head :source-base base}))
                      :executeStructured (fn [prompt _ _ head _]
                                           (swap! seen assoc :head head :prompt prompt)
                                           (js/Promise.reject (js/Error. "Fixture stops before provider/model")))}
          result (with-redefs [r/runtime! (constantly runner) r/opencode-version! (constantly "fixture-version")]
                   (r/model! {:target {:head successor} :proposal proposal :base main-sha :coverage coverage}))]
      (-> result
            (.catch (fn [_]
                      (is (= successor (:source-head @seen) (:head @seen)))
                      (is (= main-sha (:source-base @seen)))
                      (is (str/includes? (:prompt @seen) (str "Head: " successor)))))
          (.finally done)))))

(defn budget-context [fixture padding]
  (let [native (update-in (:context fixture) [:thread :comments :nodes 0 :body] str padding)
        target (r/target native [] policy)
        proposal (r/native-comment (fixture-comment 7101
                    (str "Actionability proposal v1 for " head ":\n" (pr-str (a/context-binding target)))
                    "2026-10-04T12:00:00Z" user) true)]
    (assoc fixture :context native :comments [proposal (r/native-comment (:trigger fixture) true)])))

(defn intake-budget-observation [fixture]
  ;; Keep actual main!, live collector, EDN serialization and filesystem. Only
  ;; native API/policy/Git reads are synthetic; model and publisher never run.
  (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-input-budget-"))
        event-file (path/join directory "event.json") input-file (path/join directory "input.edn")
        result-file (path/join directory "result.edn") readback-file (path/join directory "readback.edn")
        settings {"ASSESSMENT_COMMAND" "intake" "ASSESSMENT_POLICY" "fixture-policy"
                  "GITHUB_EVENT_PATH" event-file "ASSESSMENT_INPUT" input-file
                  "ASSESSMENT_RESULT" result-file "ASSESSMENT_READBACK" readback-file}
        previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
        state (atom fixture) calls (atom []) posts (atom 0) models (atom 0) publishers (atom 0)
        expected (r/validate-intake! fixture) serialized (pr-str expected)]
    (try
      (fs/writeFileSync event-file (js/JSON.stringify (clj->js (:event fixture))))
      (doseq [[k v] settings] (aset js/process.env k v))
      (let [error (try
                    (with-redefs [r/policy! (fn [_] policy)
                                  r/gh-api! (scoped-api state calls posts identity)
                                  r/coverage! (fn [& _] (:coverage fixture))
                                  r/model! (fn [& _] (swap! models inc) (throw (js/Error. "No fixture model")))
                                  r/publish! (fn [& _] (swap! publishers inc) (throw (js/Error. "No fixture App")))]
                      (r/main!))
                    nil (catch :default e (ex-message e)))
            exists (fs/existsSync input-file)
            readback (when exists
                       (try
                         (let [text (r/read-bounded input-file) value (edn/read-string text)]
                           {:sha256 (r/sha text) :coverage-sha256 (get-in value [:coverage :diff-sha256])
                            :diff-sha256 (r/sha (get-in value [:coverage :diff]))
                            :identity-coverage (get-in value [:identity 5])})
                         (catch :default e {:error (ex-message e)})))
            observation {:error error :artifact exists :readback readback
                         :serialized-bytes (.-length (js/Buffer.from serialized "utf8"))
                         :serialized-UTF16-units (.-length serialized) :expected-sha256 (r/sha serialized)
                         :artifact-bytes (when exists (.-size (fs/statSync input-file)))
                         :result-artifact (fs/existsSync result-file) :readback-artifact (fs/existsSync readback-file)
                         :models @models :publishers @publishers :posts @posts}]
        (println "[serialized-intake-budget]"
                 (pr-str (dissoc observation :readback :expected-sha256)))
        observation)
      (finally
        (doseq [[k v] previous]
          (if v (aset js/process.env k v) (js-delete js/process.env k)))
        (fs/rmSync directory #js {:recursive true :force true})))))

(deftest coverage-identity-is-compact-with-authoritative-digest-and-files
  (let [original (r/validate-intake! intake)
        compact (select-keys coverage [:diff-sha256 :files])
        diff "different complete fixture diff"
        changed (r/validate-intake! (assoc intake :coverage
                                         (assoc coverage :diff diff :diff-sha256 (r/sha diff))))
        files (r/validate-intake! (assoc-in intake [:coverage :files] [".github/scripts/assessment_route.cljs"]))]
    (is (= compact (get-in original [:identity 5])))
    (is (= coverage (:coverage original)))
    (is (str/includes? (r/prompt original) (:diff coverage)))
    (is (not= (:identity original) (:identity changed)))
    (is (not= (:identity original) (:identity files)))
    (is (refuses? #(r/final-check! original changed (result (review "informational")))))
    (is (refuses? #(r/final-check! original files (result (review "informational")))))
    ;; Full frozen input hash remains sensitive to all bytes, beyond identity.
    (is (not= (r/sha (pr-str original)) (r/sha (pr-str (assoc-in original [:coverage :diff] diff)))))))

(deftest real-intake-handoff-admits-readable-near-budget-and-refuses-serialized-overhead
  (let [mib (* 1024 1024) transport (* 2 mib)
        fixture (fn [diff padding]
                  (budget-context (assoc (scoped-fixture head) :coverage
                                         {:diff diff :diff-sha256 (r/sha diff) :files (:files coverage)}) padding))
        cases [["near1MiB ASCII" (fixture (.repeat "x" mib) "") true]
               ["near1MiB multibyte" (fixture (.repeat "世" (quot mib 3)) "") true]
               ["EDN escaping overhead" (fixture (.repeat "\"" mib) "") false]
               ["multibyte context overhead" (fixture (.repeat "世" 300000) (.repeat "世" 500000)) false]
               ["ASCII context overlimit" (fixture "small diff" (.repeat "x" transport)) false]]]
    (doseq [[label input admitted?] cases]
      (let [out (intake-budget-observation input)]
        (is (<= (.-length (js/Buffer.from (get-in input [:coverage :diff]) "utf8")) mib) label)
        (is (= admitted? (:artifact out)) label)
        (is (zero? (:models out))) (is (zero? (:publishers out))) (is (zero? (:posts out)))
        (is (false? (:result-artifact out))) (is (false? (:readback-artifact out)))
        (if admitted?
          (do
            (is (nil? (:error out)) label)
            (is (nil? (get-in out [:readback :error])) label)
            (is (<= (:serialized-bytes out) transport) label)
            (is (= (:serialized-bytes out) (:artifact-bytes out)) label)
            (is (= (:expected-sha256 out) (get-in out [:readback :sha256])) label)
            (is (= (get-in input [:coverage :diff-sha256])
                   (get-in out [:readback :coverage-sha256]) (get-in out [:readback :diff-sha256])) label))
          (do
            (is (some? (:error out)) label)
            (is (> (:serialized-bytes out) transport) label)
            (is (nil? (:artifact-bytes out)) label)))
        (when (= "multibyte context overhead" label)
          (is (< (:serialized-UTF16-units out) transport)
              "UTF16 length would admit an unreadable UTF8-byte payload"))))))

(deftest actual-intake-write-and-read-share-inclusive-UTF8-byte-boundary
  (let [limit (* 2 1024 1024)
        extend-diff (fn [fixture]
                      (let [diff (str (get-in fixture [:coverage :diff]) "x")]
                        (assoc fixture :coverage (assoc (:coverage fixture) :diff diff :diff-sha256 (r/sha diff)))))
        initial (budget-context (scoped-fixture head) "")
        initial-size (.-length (js/Buffer.from (pr-str (r/validate-intake! initial)) "utf8"))
        fixture (if (odd? initial-size) (extend-diff initial) initial)
        size (.-length (js/Buffer.from (pr-str (r/validate-intake! fixture)) "utf8"))
        step (- (.-length (js/Buffer.from (pr-str (r/validate-intake! (budget-context fixture "x"))) "utf8")) size)
        padding (quot (- limit size) step)]
    ;; Derive context repetition from actual serialization, retaining all fields.
    (is (even? size)) (is (= 2 step))
    (is (pos? padding))
    (doseq [extra [0 1]]
      (let [input (budget-context (if (zero? extra) fixture (extend-diff fixture)) (.repeat "x" padding))
            out (intake-budget-observation input)]
        (is (= (+ limit extra) (:serialized-bytes out)))
        (is (= (zero? extra) (:artifact out)))
        (is (zero? (:models out))) (is (zero? (:publishers out))) (is (zero? (:posts out)))
        (if (zero? extra)
          (do (is (nil? (:error out)))
              (is (nil? (get-in out [:readback :error])))
              (is (= (:expected-sha256 out) (get-in out [:readback :sha256]))))
          (is (some? (:error out))))))))

(deftest full-coverage-refuses-raw-diff-mutation-with-unchanged-identity
  (let [mutated (update-in snapshot [:coverage :diff] str "\nmutated artifact bytes")]
    (is (= (:identity snapshot) (:identity mutated)))
    (is (= (select-keys (:coverage snapshot) [:diff-sha256 :files])
           (select-keys (:coverage mutated) [:diff-sha256 :files])))
    (is (not= (:coverage snapshot) (:coverage mutated)))
    (doseq [[original current] [[mutated snapshot] [snapshot mutated]]]
      ;; Recompute the frozen result hash so its self-consistency check cannot
      ;; hide the missing comparison against freshly collected complete bytes.
      (let [frozen (assoc (result (review "informational"))
                          :input-sha256 (r/sha (pr-str original)))
            posts (atom 0)
            final-refused (refuses? #(r/final-check! original current frozen))
            publish-refused (refuses? #(r/publish! (fn [& _] (swap! posts inc))
                                                  original frozen (constantly current)))]
        (is (= (:input-sha256 frozen) (r/sha (pr-str original))))
        (is final-refused)
        (is publish-refused)
        (is (zero? @posts))
        (println "[full-coverage-final]" (pr-str {:final-refused final-refused
                  :publish-refused publish-refused :posts @posts
                  :identity-unchanged (= (:identity original) (:identity current))}))))))

(deftest actual-main-refuses-mutated-input-before-model-mint-and-post
  (let [fixture (scoped-fixture head)
        original (r/validate-intake! fixture)
        mutated (update-in original [:coverage :diff] str "\nmutated frozen UTF8 diff")
        frozen {:input-sha256 (r/sha (pr-str mutated)) :runner-sha256 r/runtime-hash
                :review (scoped-review original)}
        workflow (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        publisher (second (re-find #"(?s)\n  scoped-assessment-publish:(.*?)(?:\n  [a-z][a-z0-9-]*:|$)" workflow))]
    (is (= (:identity original) (:identity mutated)))
    (is (= (:input-sha256 frozen) (r/sha (pr-str mutated))))
    (is (not= (:input-sha256 frozen) (r/sha (pr-str original))))
    (is (true? (publisher-check-before-mint? publisher)))
    (doseq [mode ["model" "check" "publish"]]
      (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-coverage-binding-"))
            input-file (path/join directory "input.edn") event-file (path/join directory "event.json")
            result-file (path/join directory "result.edn") readback-file (path/join directory "readback.edn")
            settings {"ASSESSMENT_COMMAND" mode "ASSESSMENT_POLICY" "fixture-policy"
                      "GITHUB_EVENT_PATH" event-file "ASSESSMENT_INPUT" input-file
                      "ASSESSMENT_RESULT" result-file "ASSESSMENT_READBACK" readback-file}
            previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
            state (atom fixture) calls (atom []) posts (atom 0) models (atom 0) mint-sentinel (atom 0)]
        (try
          (fs/writeFileSync input-file (pr-str mutated))
          (fs/writeFileSync event-file (js/JSON.stringify (clj->js (:event fixture))))
          (fs/writeFileSync result-file (pr-str frozen))
          (doseq [[k v] settings] (aset js/process.env k v))
          (let [error (try
                        (with-redefs [r/policy! (fn [_] policy)
                                      r/gh-api! (scoped-api state calls posts identity)
                                      r/coverage! (fn [& _] (:coverage fixture))
                                      r/model! (fn [& _] (swap! models inc)
                                                 (throw (js/Error. "Model spy must remain unreachable")))]
                          (r/main!)
                          ;; The real workflow runs check before App mint. This
                          ;; sentinel records reachability, never invokes App.
                          (when (= mode "check") (swap! mint-sentinel inc)))
                        nil (catch :default e (ex-message e)))]
            (is (= (if (= mode "model") "Input changed before model"
                       "Native/Git input changed after model execution") error))
            (is (zero? @models)) (is (zero? @posts)) (is (zero? @mint-sentinel))
            (is (false? (fs/existsSync readback-file)))
            (is (= (pr-str mutated) (fs/readFileSync input-file "utf8")))
            (is (= (pr-str frozen) (fs/readFileSync result-file "utf8")))
            (is (= 1 (count (filter #(= ["GET" "repos/open-hax/uxx/pulls/14"] %) @calls))))
            (println "[full-coverage-main]" (pr-str {:mode mode :error error :models @models
                      :posts @posts :downstream-mint-sentinel @mint-sentinel
                      :readback-artifact (fs/existsSync readback-file)})))
          (finally
            (doseq [[k v] previous]
              (if v (aset js/process.env k v) (js-delete js/process.env k)))
            (fs/rmSync directory #js {:recursive true :force true})))))))

(def volatile-base-fields
  {:open_issues_count 7 :stargazers_count 3 :size 9012
   :pushed_at "2026-10-04T13:00:00Z" :updated_at "2026-10-04T13:01:00Z"})

(defn with-base-metadata [fixture]
  (update-in fixture [:live-pr :base :repo] merge volatile-base-fields))

(defn mutate-base-metadata [fixture field]
  (update-in fixture [:live-pr :base :repo field]
             #(if (number? %) (inc %) "2026-10-04T13:02:00Z")))

(defn cached-base-main-observation [original current mode after-readback]
  ;; Actual main!/live!/publish!, event, EDN and filesystem. Native API/Git/
  ;; policy reads and a synthetic completed model are the only fixture seams.
  (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-base-metadata-"))
        input-file (path/join directory "input.edn") event-file (path/join directory "event.json")
        result-file (path/join directory "result.edn") readback-file (path/join directory "readback.edn")
        input (r/validate-intake! original) value (scoped-review input)
        frozen {:input-sha256 (r/sha (pr-str input)) :runner-sha256 r/runtime-hash :review value}
        settings {"ASSESSMENT_COMMAND" mode "ASSESSMENT_POLICY" "fixture-policy"
                  "GITHUB_EVENT_PATH" event-file "ASSESSMENT_INPUT" input-file
                  "ASSESSMENT_RESULT" result-file "ASSESSMENT_READBACK" readback-file}
        previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
        state (atom current) calls (atom []) posts (atom 0) model-spy (atom 0)
        observed-input (atom nil) mint-sentinel (atom 0)]
    (fs/writeFileSync input-file (pr-str input))
    (fs/writeFileSync event-file (js/JSON.stringify (clj->js (:event original))))
    (fs/writeFileSync result-file (pr-str frozen))
    (doseq [[k v] settings] (aset js/process.env k v))
    (let [execution (try
                      (with-redefs [r/policy! (fn [_] policy)
                                    r/gh-api! (scoped-api state calls posts after-readback)
                                    r/coverage! (fn [& _] (:coverage @state))
                                    r/model! (fn [snapshot]
                                               (swap! model-spy inc) (reset! observed-input snapshot)
                                               (js/Promise.resolve value))]
                        (js/Promise.resolve (r/main!)))
                      (catch :default e (js/Promise.reject e)))]
      (-> execution
          (.then (fn [_] (when (= mode "check") (swap! mint-sentinel inc)) nil))
          (.catch ex-message)
          (.then (fn [error]
                   (let [observation {:mode mode :error error :model-spy @model-spy :posts @posts
                                      :downstream-mint-sentinel @mint-sentinel
                                      :readback-artifact (fs/existsSync readback-file)
                                      :input-retained (= (pr-str input) (fs/readFileSync input-file "utf8"))
                                      :full-cached-base-retained (= (:base (:live-pr original)) (:cached-pr-base input))
                                      :model-full-cached-base-retained
                                      (when @observed-input (= (:cached-pr-base input) (:cached-pr-base @observed-input)))}]
                     (println "[cached-base-main]" (pr-str observation)) observation)))
          (.finally (fn []
                      (doseq [[k v] previous]
                        (if v (aset js/process.env k v) (js-delete js/process.env k)))
                      (fs/rmSync directory #js {:recursive true :force true})))))))

(deftest cached-base-identity-projects-authoritative-fields-and-retains-provenance
  (let [fixture (with-base-metadata (scoped-fixture head))
        input (r/validate-intake! fixture)]
    (is (= (select-keys (:base (:live-pr fixture)) [:ref :sha]) (get-in input [:identity 8])))
    (is (= (:base (:live-pr fixture)) (:cached-pr-base input)))
    (doseq [field (keys volatile-base-fields)]
      (let [changed (r/validate-intake! (mutate-base-metadata fixture field))]
        (is (not= (:cached-pr-base input) (:cached-pr-base changed)))))))

(deftest actual-main-accepts-only-volatile-base-metadata-drift
  (async done
    (let [fixture (with-base-metadata (scoped-fixture head))
          valid (concat (for [field (keys volatile-base-fields) mode ["model" "check" "publish"]]
                          {:field field :mode mode :fresh (mutate-base-metadata fixture field) :after identity})
                        (for [field (keys volatile-base-fields)]
                          {:field field :mode "publish" :fresh fixture
                           :after #(mutate-base-metadata % field)}))
          safety [(assoc-in fixture [:live-pr :base :repo :id] 1)
                  (assoc-in fixture [:live-pr :base :repo :node_id] "R_other")
                  (assoc-in fixture [:live-pr :base :repo :private] true)
                  (assoc-in fixture [:live-pr :base :repo :full_name] "fork/uxx")
                  (assoc-in fixture [:live-pr :base :ref] "staging")
                  (assoc-in fixture [:live-pr :base :sha] (apply str (repeat 40 "8")))
                  (advance-main fixture)
                  (update-in fixture [:coverage :diff] str " changed raw diff, same declared digest/files")]
          cases (concat (map #(assoc % :admitted? true) valid)
                        (for [changed safety mode ["model" "check" "publish"]]
                          {:mode mode :fresh changed :after identity :admitted? false}))]
      (-> (reduce
            (fn [chain {:keys [mode fresh after admitted?]}]
              (.then chain
                (fn [_]
                  (-> (cached-base-main-observation fixture fresh mode after)
                      (.then (fn [out]
                               (is (:input-retained out)) (is (:full-cached-base-retained out))
                               (if admitted?
                                 (do (is (nil? (:error out)))
                                     (is (= (if (= mode "model") 1 0) (:model-spy out)))
                                     (is (= (if (= mode "publish") 1 0) (:posts out)))
                                     (is (= (if (= mode "check") 1 0) (:downstream-mint-sentinel out)))
                                     (is (= (= mode "publish") (:readback-artifact out)))
                                     (when (= mode "model") (is (:model-full-cached-base-retained out))))
                                 (do (is (some? (:error out)))
                                     (is (zero? (:model-spy out))) (is (zero? (:posts out)))
                                     (is (zero? (:downstream-mint-sentinel out)))
                                     (is (false? (:readback-artifact out)))))))))))
            (js/Promise.resolve nil) cases)
          (.catch (fn [error] (is false (ex-message error))))
          (.finally done)))))


(defn checkpoint-review [input decision]
  (if (= decision "informational") (scoped-review input)
    (let [value (-> (select-keys (scoped-review input) [:head :diffSha256 :coveredFiles :summary :comments])
                    (update :summary str/replace "\"informational\"" (pr-str decision))
                    (update :summary str/replace "complete-context/no-defect/no-request/no-question"
                            "scope-incomplete-or-finding")) c (:coverage input)]
      (js->clj (.parseStructured (r/runtime!) (native-response value "low") (get-in input [:target :head])
                                #js {:diffSha256 (:diff-sha256 c) :coveredFiles (clj->js (:files c))})
               :keywordize-keys true))))

(defn publication-checkpoint-observation
  ([failure decision destination] (publication-checkpoint-observation failure decision destination nil))
  ([failure decision destination prior-bytes]
  ;; Real main!/live!/final-check!/publish! and filesystem; only native API,
  ;; policy and Git reads are local fixtures. The model spy must never run.
  (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-publication-checkpoint-"))
        input-file (path/join directory "input.edn") result-file (path/join directory "result.edn")
        event-file (path/join directory "event.json")
        readback-file (case destination
                        :missing-parent (path/join directory "missing" "readback.edn")
                        :directory directory
                        (path/join directory "readback.edn"))
        fixture (scoped-fixture head) input (r/validate-intake! fixture)
        value (checkpoint-review input decision)
        frozen {:input-sha256 (r/sha (pr-str input)) :runner-sha256 r/runtime-hash :review value}
        settings {"ASSESSMENT_COMMAND" "publish" "ASSESSMENT_POLICY" "fixture-policy"
                  "GITHUB_EVENT_PATH" event-file "ASSESSMENT_INPUT" input-file
                  "ASSESSMENT_RESULT" result-file "ASSESSMENT_READBACK" readback-file}
        previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
        state (atom (if (= failure :duplicate-before-post)
                      (update fixture :comments conj
                              (fixture-comment 7104 (:summary value) "2026-10-04T12:10:00Z" bot)) fixture))
        calls (atom []) posts (atom 0) model-spy (atom 0)
        post-entry-checkpoint (atom nil)
        mutate (case failure
                 :live-base advance-main
                 :head #(assoc-in % [:live-pr :head :sha] (apply str (repeat 40 "8")))
                 :context #(update-in % [:context :thread :comments :nodes 0 :body] str " changed")
                 :repository-id #(assoc-in % [:live-pr :base :repo :id] 1)
                 :missing-trigger #(update % :comments (fn [rows] (vec (remove (fn [c] (= 7102 (:id c))) rows))))
                 :canonical-conflict #(update % :comments conj
                                              (fixture-comment 7106 (:summary (checkpoint-review input "finding"))
                                                               "2026-10-04T12:11:00Z" bot))
                 identity)
        fixture-api (scoped-api state calls posts mutate)
        api! (fn [method endpoint payload]
               (when (= [method endpoint] ["POST" "repos/open-hax/uxx/issues/14/comments"])
                 (when (and (fs/existsSync readback-file) (.isFile (fs/statSync readback-file)))
                   (reset! post-entry-checkpoint (try (edn/read-string (fs/readFileSync readback-file "utf8"))
                                                    (catch :default _ nil)))))
               (when (and (= failure :collector) (= endpoint "graphql"))
                 (throw (js/Error. "PRIVATE_COLLECTOR_ERROR_SENTINEL")))
               (if (and (= failure :readback-api) (= endpoint "repos/open-hax/uxx/issues/comments/7104"))
                 (throw (js/Error. "PRIVATE_RESPONSE_ERROR_SENTINEL"))
                 (let [out (fixture-api method endpoint payload)]
                   ;; Simulate remote creation followed by an ambiguous response;
                   ;; the publisher cannot infer absence or invent the fixture ID.
                   (when (and (= failure :post-exception)
                              (= [method endpoint] ["POST" "repos/open-hax/uxx/issues/14/comments"]))
                     (throw (js/Error. "PRIVATE_RESPONSE_POST_ERROR_SENTINEL")))
                   (if (and (= failure :post-missing-id)
                            (= [method endpoint] ["POST" "repos/open-hax/uxx/issues/14/comments"]))
                     (dissoc out :id)
                     (if (= endpoint "repos/open-hax/uxx/issues/comments/7104")
                     (case failure
                       :readback-identity (assoc-in out [:user :id] 1)
                       :readback-body (assoc out :body "PRIVATE_RESPONSE_BODY_SENTINEL")
                       out) out)))))]
    (try
      (fs/writeFileSync input-file (pr-str input)) (fs/writeFileSync result-file (pr-str frozen))
      (fs/writeFileSync event-file (js/JSON.stringify (clj->js (:event fixture))))
      (when prior-bytes (fs/writeFileSync readback-file prior-bytes))
      (doseq [[k v] settings] (aset js/process.env k v))
      (let [refused (refuses? #(with-redefs [r/policy! (fn [_] policy) r/gh-api! api!
                                            r/coverage! (fn [& _] (:coverage @state))
                                            r/model! (fn [& _] (swap! model-spy inc)
                                                       (throw (js/Error. "Fixture model must not run")))]
                                 (r/main!)))
            exists? (and (fs/existsSync readback-file) (.isFile (fs/statSync readback-file)))
            bytes (when exists? (fs/readFileSync readback-file "utf8"))
            record (when bytes (try (edn/read-string bytes) (catch :default _ nil)))
            out {:prior-bytes-retained (= prior-bytes bytes)
                 :failure failure :decision decision :destination destination :refused refused
                 :posts @posts :model-spy @model-spy :record record
                 :synthetic-remote-created (some? (:published @state))
                 :native-readback-attempts (count (filter #(= "repos/open-hax/uxx/issues/comments/7104" (second %)) @calls))
                 :post-entry-checkpoint @post-entry-checkpoint
                 :input-retained (= (pr-str input) (fs/readFileSync input-file "utf8"))
                 :no-sensitive-content (not (or (str/includes? (or bytes "") (:summary value))
                                               (str/includes? (or bytes "") "PRIVATE_RESPONSE")))
                 :no-temporary-residue (not-any? #(str/starts-with? % ".assessment-checkpoint-")
                                                (js->clj (fs/readdirSync directory)))
                 :artifact-mode (when exists? (bit-and 511 (.-mode (fs/statSync readback-file))))
                 :expected-body-sha256 (r/sha (:summary value)) :expected-input-sha256 (:input-sha256 frozen)}]
        (println "[publication-checkpoint-main]" (pr-str out)) out)
      (finally
        (doseq [[k v] previous] (if v (aset js/process.env k v) (js-delete js/process.env k)))
        (fs/rmSync directory #js {:recursive true :force true}))))))

(deftest actual-main-publication-checkpoints-retain-positive-id-through-later-refusals
  (doseq [[failure expected-stage] [[:readback-api :published-unverified]
                                   [:readback-identity :published-unverified]
                                   [:readback-body :published-unverified]
                                   [:live-base :readback-verified] [:head :readback-verified]
                                   [:context :readback-verified] [:repository-id :readback-verified]
                                   [:missing-trigger :readback-verified]
                                   [:canonical-conflict :canonical-disposition-observed]
                                   [:none :complete]]]
    (let [out (publication-checkpoint-observation failure "informational" :file) record (:record out)]
      (is (= (not= failure :none) (:refused out)))
      (is (= 1 (:posts out))) (is (zero? (:model-spy out))) (is (:input-retained out))
      (is (:no-sensitive-content out)) (is (:no-temporary-residue out))
      (is (= :publication-unconfirmed (get-in out [:post-entry-checkpoint :publication-state])))
      (is (= :not-established (get-in out [:post-entry-checkpoint :qualification])))
      (is (some? record))
      (when record
        (is (= 7104 (:native-id record)))
        (is (= "https://github.com/open-hax/uxx/pull/14#issuecomment-7104" (:native-url record)))
        (is (= head (:head record))) (is (= r/runtime-hash (:runner-sha256 record)))
        (is (= (:expected-body-sha256 out) (:body-sha256 record)))
        (is (= (:expected-input-sha256 out) (:input-sha256 record)))
        (is (= 384 (:artifact-mode out)))
        (is (not-any? #(contains? record %) [:body :error :credentials :token]))
        (is (= expected-stage (:publication-state record)))
        (is (= (if (= failure :none) :verified-scoped-assessment :not-established) (:qualification record)))
        (when (= failure :none)
          (is (= :informational (get-in record [:disposition :kind])))
          (is (map? (:execution-control record)))))))
  (doseq [decision ["finding" "uncertain"]]
    (let [out (publication-checkpoint-observation :none decision :file) record (:record out)]
      (is (false? (:refused out))) (is (= 1 (:posts out))) (is (zero? (:model-spy out)))
      (is (= :complete (:publication-state record)))
      (is (= :verified-scoped-assessment (:qualification record)))
      (is (= decision (:decision record))) (is (= :finding (get-in record [:disposition :kind]))))))

(deftest actual-main-preflights-publication-artifact-before-the-only-post
  (doseq [destination [:missing-parent :directory]]
    (let [out (publication-checkpoint-observation :none "informational" destination)]
      (is (:refused out)) (is (zero? (:posts out))) (is (zero? (:model-spy out)))
      (is (nil? (:record out))) (is (:input-retained out)) (is (:no-temporary-residue out)))))

(deftest atomic-publication-checkpoint-write-retains-prior-evidence-on-replacement-failure
  (let [writer-var (resolve 'assessment-route/write-publication-checkpoint!)]
    (is (some? writer-var))
    (when writer-var
      (let [writer @writer-var directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-checkpoint-atomic-"))
            file (path/join directory "readback.edn")
            record {:native-id 7104 :publication-state :published-unverified :qualification :not-established}]
        (try
          (writer file record)
          (let [bytes (fs/readFileSync file "utf8")]
            ;; Same artifact path, actual filesystem permission failure on the
            ;; next replacement: the last positive native checkpoint must survive.
            (fs/chmodSync directory 320)
            (is (refuses? #(writer file (assoc record :publication-state :readback-verified))))
            (is (= bytes (fs/readFileSync file "utf8")))
            (is (= ["readback.edn"] (js->clj (fs/readdirSync directory)))))
          (finally (fs/chmodSync directory 448)
                   (fs/rmSync directory #js {:recursive true :force true})))))))

(deftest existing-publication-checkpoint-survives-retry-preflight-and-collector-dedup-refusals
  (let [prior {:native-id 7099 :native-url "https://github.com/open-hax/uxx/pull/14#issuecomment-7099"
               :head head :body-sha256 (r/sha "earlier synthetic publication")
               :input-sha256 (r/sha "earlier frozen input")
               :publication-state :published-unverified :qualification :not-established}
        prior-bytes (str "  " (pr-str prior) "\n")]
    (doseq [failure [:collector :duplicate-before-post]]
      (let [out (publication-checkpoint-observation failure "informational" :file prior-bytes)]
        (is (:refused out)) (is (zero? (:posts out))) (is (zero? (:model-spy out)))
        (is (:prior-bytes-retained out)) (is (= prior (:record out)))
        (is (nil? (:post-entry-checkpoint out))) (is (:no-temporary-residue out))))
    (let [out (publication-checkpoint-observation :none "informational" :file prior-bytes)]
      (is (false? (:refused out))) (is (= 1 (:posts out))) (is (zero? (:model-spy out)))
      (is (= prior (:post-entry-checkpoint out)))
      (is (= 7104 (get-in out [:record :native-id])))
      (is (= :complete (get-in out [:record :publication-state]))))
    (doseq [malformed ["[" "[:not-a-checkpoint]" "42"]]
      (let [out (publication-checkpoint-observation :none "informational" :file malformed)]
        (is (:refused out)) (is (zero? (:posts out))) (is (zero? (:model-spy out)))
        (is (:prior-bytes-retained out)) (is (:no-temporary-residue out))))))

(deftest actual-main-ambiguous-post-retains-unconfirmed-checkpoint-without-invented-id
  (doseq [failure [:post-exception :post-missing-id]]
    (let [out (publication-checkpoint-observation failure "informational" :file) record (:record out)]
      (is (:refused out)) (is (= 1 (:posts out))) (is (:synthetic-remote-created out))
      (is (zero? (:native-readback-attempts out))) (is (zero? (:model-spy out)))
      (is (:input-retained out)) (is (:no-sensitive-content out)) (is (:no-temporary-residue out))
      (is (= 384 (:artifact-mode out)))
      (is (= {:publication-state :publication-unconfirmed :qualification :not-established} record))
      (is (not-any? #(contains? record %) [:native-id :native-url :native-node-id :body :error :credentials :token]))
      (is (= record (:post-entry-checkpoint out)))))
  (let [prior {:native-id 7099 :publication-state :published-unverified :qualification :not-established}
        out (publication-checkpoint-observation :post-exception "informational" :file (pr-str prior))]
    (is (:refused out)) (is (= 1 (:posts out))) (is (:synthetic-remote-created out))
    (is (zero? (:native-readback-attempts out))) (is (zero? (:model-spy out)))
    (is (= prior (:record out))) (is (= prior (:post-entry-checkpoint out)))))


;; These native comment/context values were captured in the sealed read-only
;; audit for trigger5985900029. List and single-comment endpoints vary only the
;; actor avatar URL. This fixture's event envelope, permission API and coverage
;; seams are local reconstructions, not the unavailable hosted event/token or
;; an actual model/App result. Keep raw native maps in the frozen input.
(def captured-native-actors {:context {:repository {:id "R_kgDOR5O5HA", :databaseId 1200863516, :nameWithOwner "open-hax/uxx"}, :pr {:id "PR_kwDOR5O5HM8AAAABGXQN_A", :number 14, :state "OPEN", :isDraft false, :headRefOid "80fe32fc8c293ea4cd329e2740651fa45240f219", :author {:login "riatzukiza", :__typename "User", :id "MDQ6VXNlcjEwNjc2OTI1", :databaseId 10676925}}, :thread {:id "PRRT_kwDOR5O5HM6omklO", :isResolved true, :isOutdated false, :path ".github/workflows/opencode-code-review.yml", :line 239, :comments {:totalCount 2, :pageInfo {:hasNextPage false}, :nodes [{:updatedAt "2026-10-03T10:25:12Z", :createdAt "2026-10-03T10:25:12Z", :originalCommit {:oid "68eeefdca9d840571e2dec911085b782dc5c4ed2"}, :author {:login "riatzukiza", :__typename "User", :id "MDQ6VXNlcjEwNjc2OTI1", :databaseId 10676925}, :pullRequestReview {:id "PRR_kwDOR5O5HM8AAAABQeHYew", :databaseId 5400287355, :state "COMMENTED", :body "", :updatedAt "2026-10-03T10:25:12Z", :commit {:oid "68eeefdca9d840571e2dec911085b782dc5c4ed2"}, :author {:login "riatzukiza", :__typename "User", :id "MDQ6VXNlcjEwNjc2OTI1", :databaseId 10676925}}, :id "PRRC_kwDOR5O5HM74t3-s", :commit {:oid "80fe32fc8c293ea4cd329e2740651fa45240f219"}, :url "https://github.com/open-hax/uxx/pull/14#discussion_r4172775340", :databaseId 4172775340, :diffHunk "@@ -1,111 +1,159 @@\n name: OpenCode Kimi PR Review\n \n on:\n-  workflow_dispatch:\n+  pull_request:\n+    types: [opened, synchronize, reopened, ready_for_review]\n \n concurrency:\n   group: opencode-kimi-review-${{ github.event.pull_request.number }}\n   cancel-in-progress: true\n \n jobs:\n+  runner-tests:\n+    name: Review runner regression tests\n+    runs-on: ubuntu-latest\n+    permissions:\n+      contents: read\n+    steps:\n+      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd\n+        with:\n+          ref: ${{ github.event.pull_request.head.sha }}\n+          persist-credentials: false\n+      - run: node --test .github/scripts/kimi-review.test.cjs\n+\n   review:\n+    needs: runner-tests\n+    timeout-minutes: 30\n     name: Review pull request with OpenCode\n     if: ${{ github.event.pull_request.draft == false && github.event.pull_request.head.repo.full_name == github.repository }}\n     runs-on: ubuntu-latest\n     env:\n-      HAS_DISCORD_REVIEW_WEBHOOK_URL: ${{ secrets.DISCORD_REVIEW_WEBHOOK_URL != '' }}\n+      # The helper source must be a reviewed immutable base ancestor; workflow YAML retains the repository contributor trust boundary.\n+      KIMI_RUNTIME_SHA: f2ca216e3ea64ac84acc8772648dc93cbfe5e57a\n     permissions:\n-      id-token: write\n       contents: read\n       pull-requests: write\n       issues: write\n     steps:\n       - name: Checkout repository\n-        uses: actions/checkout@v6\n+        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd\n         with:\n+          ref: ${{ github.event.pull_request.head.sha }}\n+          fetch-depth: 0\n           persist-credentials: false\n \n-      - name: Capture review start time\n-        id: review_start\n-        run: echo \"started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)\" >> \"$GITHUB_OUTPUT\"\n+      - name: Install verified OpenCode CLI\n+        env:\n+          OPENCODE_VERSION: 1.18.34\n+          OPENCODE_SHA256: 0f22479647226d1d2dd99595d20082ee7bda3870b62dc6a90b41efc1a71d7e9a\n+        run: |\n+          set -euo pipefail\n+          archive=\"$RUNNER_TEMP/opencode.tar.gz\"\n+          curl --fail --silent --show-error --location \\\n+            \"https://github.com/anomalyco/opencode/releases/download/v${OPENCODE_VERSION}/opencode-linux-x64.tar.gz\" \\\n+            --output \"$archive\"\n+          echo \"${OPENCODE_SHA256}  $archive\" | sha256sum --check --strict\n+          mkdir -p \"$RUNNER_TEMP/opencode-bin\"\n+          tar -xzf \"$archive\" -C \"$RUNNER_TEMP/opencode-bin\"\n+          echo \"$RUNNER_TEMP/opencode-bin\" >> \"$GITHUB_PATH\"\n+          test \"$(\"$RUNNER_TEMP/opencode-bin/opencode\" --version)\" = \"$OPENCODE_VERSION\"\n \n-      - name: Run OpenCode review\n-        uses: anomalyco/opencode/github@latest\n+      - name: Prepare immutable review runtime\n+        env:\n+          PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}\n+        run: |\n+          set -euo pipefail\n+          [[ \"$KIMI_RUNTIME_SHA\" =~ ^[0-9a-f]{40}$ ]]\n+          [[ \"$PR_BASE_SHA\" =~ ^[0-9a-f]{40}$ ]]\n+          git merge-base --is-ancestor \"$KIMI_RUNTIME_SHA\" \"$PR_BASE_SHA\"\n+          git show \"${KIMI_RUNTIME_SHA}:.github/scripts/kimi-review.cjs\" > \"$RUNNER_TEMP/kimi-review.cjs\"\n+          node --check \"$RUNNER_TEMP/kimi-review.cjs\"\n+\n+      - name: Run exact-head Kimi review without publication credentials\n+        run: node \"$RUNNER_TEMP/kimi-review.cjs\"\n         env:\n-          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n           KIMI_API_KEY: ${{ secrets.KIMI_FOR_CODING_API_KEY }}\n+          PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}\n+          PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}\n+          KIMI_REVIEW_FILE: ${{ runner.temp }}/kimi-review.json\n+\n+      - name: Record native execution provenance\n+        env:\n+          PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}\n+          PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}\n+        run: |\n+          node <<'NODE'\n+          const fs = require('node:fs'), crypto = require('node:crypto');\n+          const { execFileSync } = require('node:child_process');\n+          const e = process.env, sha = value => /^[0-9a-f]{40}$/.test(value || '');\n+          if (![e.KIMI_RUNTIME_SHA, e.PR_HEAD_SHA, e.PR_BASE_SHA, e.GITHUB_WORKFLOW_SHA].every(sha) ||\n+              !/^[1-9][0-9]*$/.test(e.GITHUB_RUN_ID || '') || !/^[1-9][0-9]*$/.test(e.GITHUB_RUN_ATTEMPT || '')) throw new Error('Invalid execution provenance');\n+          execFileSync('git', ['merge-base', '--is-ancestor', e.KIMI_RUNTIME_SHA, e.PR_BASE_SHA]);\n+          const runtimePath = `${e.RUNNER_TEMP}/kimi-review.cjs`;\n+          const runtime = fs.readFileSync(runtimePath), expected = execFileSync('git', ['show', `${e.KIMI_RUNTIME_SHA}:.github/scripts/kimi-review.cjs`]);\n+          if (!runtime.equals(expected)) throw new Error('Runtime bytes differ from immutable source');\n+          const review = JSON.parse(fs.readFileSync(`${e.RUNNER_TEMP}/kimi-review.json`, 'utf8'));\n+          const helper = require(runtimePath);\n+          helper.assertHead(e.PR_HEAD_SHA, review.head);\n+          const model = helper.structuredRequest('', review.head, review).model;\n+          if (model.providerID !== 'kimi-code-plan-global' || model.modelID !== 'kimi-for-coding') throw new Error('Unexpected requested model');\n+          const version = execFileSync('opencode', ['--version'], { encoding: 'utf8' }).trim();\n+          const archiveSha256 = crypto.createHash('sha256').update(fs.readFileSync(`${e.RUNNER_TEMP}/opencode.tar.gz`)).digest('hex');\n+          if (version !== '1.18.34' || archiveSha256 !== '0f22479647226d1d2dd99595d20082ee7bda3870b62dc6a90b41efc1a71d7e9a') throw new Error('Toolchain provenance mismatch');\n+          const provenance = {\n+            origin: 'github-actions-native-execution', repository: e.GITHUB_REPOSITORY,\n+            head: review.head, base: e.PR_BASE_SHA, runtimeSha: e.KIMI_RUNTIME_SHA,\n+            runtimeBlobSha256: crypto.createHash('sha256').update(runtime).digest('hex'), runtimeBaseAncestorVerified: true,\n+            requestedModel: model, executedModel: model,\n+            executedModelBinding: 'Successful immutable parseStructured requires assistant providerID/modelID to equal requested Kimi identities',\n+            runID: e.GITHUB_RUN_ID, runAttempt: Number(e.GITHUB_RUN_ATTEMPT),\n+            runURL: `${e.GITHUB_SERVER_URL}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}`,\n+            workflowSha: e.GITHUB_WORKFLOW_SHA, workflowRef: e.GITHUB_WORKFLOW_REF,\n+            opencodeVersion: version, archiveSha256, diffSha256: review.diffSha256, coveredFiles: review.coveredFiles,\n+          };\n+          fs.writeFileSync(`${e.RUNNER_TEMP}/kimi-provenance.json`, JSON.stringify(provenance, null, 2));\n+          NODE\n+\n+      - name: Preserve native submission and its execution provenance\n+        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02\n         with:\n-          model: kimi-for-coding/k2p5\n-          use_github_token: true\n-          prompt: |\n-            Review this pull request as a senior maintainer.\n-            Focus on correctness, security, maintainability, tests, and repo-specific conventions.\n-            Check linked GitHub issues and any synced Kanban markers (`openhax-kanban-sync`) to understand the task intent.\n-            If this repository has a kanban/ directory or docs/agent-workflows.md, use it as planning context and keep status/priority labels in mind.\n-            Submit concrete findings as GitHub PR inline review comments on the exact changed lines whenever GitHub can attach them.\n-            If there are no actionable findings, leave a short passing review summary instead of inventing comments.\n-            Do not request cosmetic churn unless it prevents confusion or future defects.\n+          name: kimi-native-${{ github.event.pull_request.number }}-${{ github.event.pull_request.head.sha }}-${{ github.run_attempt }}\n+          path: |\n+            ${{ runner.temp }}/kimi-review.json\n+            ${{ runner.temp }}/kimi-provenance.json\n+          if-no-files-found: error\n+          retention-days: 14\n \n-      - name: Send new inline review comments to Discord\n-        if: ${{ always() && env.HAS_DISCORD_REVIEW_WEBHOOK_URL == 'true' }}\n-        uses: actions/github-script@v7\n+      - name: Publish exact-head review and its own bounded Discord notifications\n+        uses: actions/github-script@f28e40c7f34bde8b3046d885e986cb6290c5673b\n         env:\n+          KIMI_REVIEW_FILE: ${{ runner.temp }}/kimi-review.json\n           DISCORD_REVIEW_WEBHOOK_URL: ${{ secrets.DISCORD_REVIEW_WEBHOOK_URL }}\n-          REVIEW_STARTED_AT: ${{ steps.review_start.outputs.started_at }}\n         with:\n           github-token: ${{ secrets.GITHUB_TOKEN }}\n           script: |\n-            const webhookUrl = process.env.DISCORD_REVIEW_WEBHOOK_URL;\n-            const startedAt = new Date(process.env.REVIEW_STARTED_AT || 0);\n-            const { owner, repo } = context.repo;\n-            const pr = context.payload.pull_request;\n-            if (!webhookUrl || !pr) return;\n-\n-            const comments = await github.paginate(github.rest.pulls.listReviewComments, {\n-              owner,\n-              repo,\n-              pull_number: pr.number,\n-              per_page: 100,\n-            });\n-            const fresh = comments\n-              .filter((comment) => new Date(comment.created_at) >= startedAt)\n-              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));\n-            if (fresh.length === 0) {\n-              core.info('No new inline review comments to send to Discord.');\n-              return;\n-            }\n-\n-            const truncate = (value, max) => {\n-              const text = String(value || '');\n-              return text.length <= max ? text : `${text.slice(0, max - 1)}…`;\n+            const fs = require('node:fs');\n+            const provenance = JSON.parse(fs.readFileSync(`${process.env.RUNNER_TEMP}/kimi-provenance.json`, 'utf8'));\n+            // Keep complete coverage in the artifact; body metadata has a fixed field set.\n+            const bodyProvenance = {\n+              origin: provenance.origin, repository: provenance.repository,\n+              head: provenance.head, base: provenance.base, runtimeSha: provenance.runtimeSha,\n+              runtimeBlobSha256: provenance.runtimeBlobSha256,\n+              runtimeBaseAncestorVerified: provenance.runtimeBaseAncestorVerified,", :body "Author walkthrough: source15 merge0602ff3 makes immutablef2 runtime ancestral to the PR base; the model step runs that extracted helper without GitHub/publication credentials. Native schema/tool validation binds full diff coverage and requested/executed Kimi identity. Per-attempt artifacts retain complete provenance; the GitHub body projects fixed source/model/run/digest metadata and file count. Actual old publisher failed the60000-character/10000-path red fixture, new publisher passes without altering the artifact. All19 regressions pass;20minute model deadline unchanged. PR workflow YAML retains the existing contributor trust boundary; generic bot publication is execution evidence, not quorum."} {:updatedAt "2026-10-03T10:25:54Z", :createdAt "2026-10-03T10:25:54Z", :originalCommit {:oid "68eeefdca9d840571e2dec911085b782dc5c4ed2"}, :author {:login "riatzukiza", :__typename "User", :id "MDQ6VXNlcjEwNjc2OTI1", :databaseId 10676925}, :pullRequestReview {:id "PRR_kwDOR5O5HM8AAAABQeHlow", :databaseId 5400290723, :state "COMMENTED", :body "", :updatedAt "2026-10-03T10:25:54Z", :commit {:oid "68eeefdca9d840571e2dec911085b782dc5c4ed2"}, :author {:login "riatzukiza", :__typename "User", :id "MDQ6VXNlcjEwNjc2OTI1", :databaseId 10676925}}, :id "PRRC_kwDOR5O5HM74t4x9", :commit {:oid "80fe32fc8c293ea4cd329e2740651fa45240f219"}, :url "https://github.com/open-hax/uxx/pull/14#discussion_r4172778621", :databaseId 4172778621, :diffHunk "@@ -1,111 +1,159 @@\n name: OpenCode Kimi PR Review\n \n on:\n-  workflow_dispatch:\n+  pull_request:\n+    types: [opened, synchronize, reopened, ready_for_review]\n \n concurrency:\n   group: opencode-kimi-review-${{ github.event.pull_request.number }}\n   cancel-in-progress: true\n \n jobs:\n+  runner-tests:\n+    name: Review runner regression tests\n+    runs-on: ubuntu-latest\n+    permissions:\n+      contents: read\n+    steps:\n+      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd\n+        with:\n+          ref: ${{ github.event.pull_request.head.sha }}\n+          persist-credentials: false\n+      - run: node --test .github/scripts/kimi-review.test.cjs\n+\n   review:\n+    needs: runner-tests\n+    timeout-minutes: 30\n     name: Review pull request with OpenCode\n     if: ${{ github.event.pull_request.draft == false && github.event.pull_request.head.repo.full_name == github.repository }}\n     runs-on: ubuntu-latest\n     env:\n-      HAS_DISCORD_REVIEW_WEBHOOK_URL: ${{ secrets.DISCORD_REVIEW_WEBHOOK_URL != '' }}\n+      # The helper source must be a reviewed immutable base ancestor; workflow YAML retains the repository contributor trust boundary.\n+      KIMI_RUNTIME_SHA: f2ca216e3ea64ac84acc8772648dc93cbfe5e57a\n     permissions:\n-      id-token: write\n       contents: read\n       pull-requests: write\n       issues: write\n     steps:\n       - name: Checkout repository\n-        uses: actions/checkout@v6\n+        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd\n         with:\n+          ref: ${{ github.event.pull_request.head.sha }}\n+          fetch-depth: 0\n           persist-credentials: false\n \n-      - name: Capture review start time\n-        id: review_start\n-        run: echo \"started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)\" >> \"$GITHUB_OUTPUT\"\n+      - name: Install verified OpenCode CLI\n+        env:\n+          OPENCODE_VERSION: 1.18.34\n+          OPENCODE_SHA256: 0f22479647226d1d2dd99595d20082ee7bda3870b62dc6a90b41efc1a71d7e9a\n+        run: |\n+          set -euo pipefail\n+          archive=\"$RUNNER_TEMP/opencode.tar.gz\"\n+          curl --fail --silent --show-error --location \\\n+            \"https://github.com/anomalyco/opencode/releases/download/v${OPENCODE_VERSION}/opencode-linux-x64.tar.gz\" \\\n+            --output \"$archive\"\n+          echo \"${OPENCODE_SHA256}  $archive\" | sha256sum --check --strict\n+          mkdir -p \"$RUNNER_TEMP/opencode-bin\"\n+          tar -xzf \"$archive\" -C \"$RUNNER_TEMP/opencode-bin\"\n+          echo \"$RUNNER_TEMP/opencode-bin\" >> \"$GITHUB_PATH\"\n+          test \"$(\"$RUNNER_TEMP/opencode-bin/opencode\" --version)\" = \"$OPENCODE_VERSION\"\n \n-      - name: Run OpenCode review\n-        uses: anomalyco/opencode/github@latest\n+      - name: Prepare immutable review runtime\n+        env:\n+          PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}\n+        run: |\n+          set -euo pipefail\n+          [[ \"$KIMI_RUNTIME_SHA\" =~ ^[0-9a-f]{40}$ ]]\n+          [[ \"$PR_BASE_SHA\" =~ ^[0-9a-f]{40}$ ]]\n+          git merge-base --is-ancestor \"$KIMI_RUNTIME_SHA\" \"$PR_BASE_SHA\"\n+          git show \"${KIMI_RUNTIME_SHA}:.github/scripts/kimi-review.cjs\" > \"$RUNNER_TEMP/kimi-review.cjs\"\n+          node --check \"$RUNNER_TEMP/kimi-review.cjs\"\n+\n+      - name: Run exact-head Kimi review without publication credentials\n+        run: node \"$RUNNER_TEMP/kimi-review.cjs\"\n         env:\n-          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n           KIMI_API_KEY: ${{ secrets.KIMI_FOR_CODING_API_KEY }}\n+          PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}\n+          PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}\n+          KIMI_REVIEW_FILE: ${{ runner.temp }}/kimi-review.json\n+\n+      - name: Record native execution provenance\n+        env:\n+          PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}\n+          PR_BASE_SHA: ${{ github.event.pull_request.base.sha }}\n+        run: |\n+          node <<'NODE'\n+          const fs = require('node:fs'), crypto = require('node:crypto');\n+          const { execFileSync } = require('node:child_process');\n+          const e = process.env, sha = value => /^[0-9a-f]{40}$/.test(value || '');\n+          if (![e.KIMI_RUNTIME_SHA, e.PR_HEAD_SHA, e.PR_BASE_SHA, e.GITHUB_WORKFLOW_SHA].every(sha) ||\n+              !/^[1-9][0-9]*$/.test(e.GITHUB_RUN_ID || '') || !/^[1-9][0-9]*$/.test(e.GITHUB_RUN_ATTEMPT || '')) throw new Error('Invalid execution provenance');\n+          execFileSync('git', ['merge-base', '--is-ancestor', e.KIMI_RUNTIME_SHA, e.PR_BASE_SHA]);\n+          const runtimePath = `${e.RUNNER_TEMP}/kimi-review.cjs`;\n+          const runtime = fs.readFileSync(runtimePath), expected = execFileSync('git', ['show', `${e.KIMI_RUNTIME_SHA}:.github/scripts/kimi-review.cjs`]);\n+          if (!runtime.equals(expected)) throw new Error('Runtime bytes differ from immutable source');\n+          const review = JSON.parse(fs.readFileSync(`${e.RUNNER_TEMP}/kimi-review.json`, 'utf8'));\n+          const helper = require(runtimePath);\n+          helper.assertHead(e.PR_HEAD_SHA, review.head);\n+          const model = helper.structuredRequest('', review.head, review).model;\n+          if (model.providerID !== 'kimi-code-plan-global' || model.modelID !== 'kimi-for-coding') throw new Error('Unexpected requested model');\n+          const version = execFileSync('opencode', ['--version'], { encoding: 'utf8' }).trim();\n+          const archiveSha256 = crypto.createHash('sha256').update(fs.readFileSync(`${e.RUNNER_TEMP}/opencode.tar.gz`)).digest('hex');\n+          if (version !== '1.18.34' || archiveSha256 !== '0f22479647226d1d2dd99595d20082ee7bda3870b62dc6a90b41efc1a71d7e9a') throw new Error('Toolchain provenance mismatch');\n+          const provenance = {\n+            origin: 'github-actions-native-execution', repository: e.GITHUB_REPOSITORY,\n+            head: review.head, base: e.PR_BASE_SHA, runtimeSha: e.KIMI_RUNTIME_SHA,\n+            runtimeBlobSha256: crypto.createHash('sha256').update(runtime).digest('hex'), runtimeBaseAncestorVerified: true,\n+            requestedModel: model, executedModel: model,\n+            executedModelBinding: 'Successful immutable parseStructured requires assistant providerID/modelID to equal requested Kimi identities',\n+            runID: e.GITHUB_RUN_ID, runAttempt: Number(e.GITHUB_RUN_ATTEMPT),\n+            runURL: `${e.GITHUB_SERVER_URL}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}`,\n+            workflowSha: e.GITHUB_WORKFLOW_SHA, workflowRef: e.GITHUB_WORKFLOW_REF,\n+            opencodeVersion: version, archiveSha256, diffSha256: review.diffSha256, coveredFiles: review.coveredFiles,\n+          };\n+          fs.writeFileSync(`${e.RUNNER_TEMP}/kimi-provenance.json`, JSON.stringify(provenance, null, 2));\n+          NODE\n+\n+      - name: Preserve native submission and its execution provenance\n+        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02\n         with:\n-          model: kimi-for-coding/k2p5\n-          use_github_token: true\n-          prompt: |\n-            Review this pull request as a senior maintainer.\n-            Focus on correctness, security, maintainability, tests, and repo-specific conventions.\n-            Check linked GitHub issues and any synced Kanban markers (`openhax-kanban-sync`) to understand the task intent.\n-            If this repository has a kanban/ directory or docs/agent-workflows.md, use it as planning context and keep status/priority labels in mind.\n-            Submit concrete findings as GitHub PR inline review comments on the exact changed lines whenever GitHub can attach them.\n-            If there are no actionable findings, leave a short passing review summary instead of inventing comments.\n-            Do not request cosmetic churn unless it prevents confusion or future defects.\n+          name: kimi-native-${{ github.event.pull_request.number }}-${{ github.event.pull_request.head.sha }}-${{ github.run_attempt }}\n+          path: |\n+            ${{ runner.temp }}/kimi-review.json\n+            ${{ runner.temp }}/kimi-provenance.json\n+          if-no-files-found: error\n+          retention-days: 14\n \n-      - name: Send new inline review comments to Discord\n-        if: ${{ always() && env.HAS_DISCORD_REVIEW_WEBHOOK_URL == 'true' }}\n-        uses: actions/github-script@v7\n+      - name: Publish exact-head review and its own bounded Discord notifications\n+        uses: actions/github-script@f28e40c7f34bde8b3046d885e986cb6290c5673b\n         env:\n+          KIMI_REVIEW_FILE: ${{ runner.temp }}/kimi-review.json\n           DISCORD_REVIEW_WEBHOOK_URL: ${{ secrets.DISCORD_REVIEW_WEBHOOK_URL }}\n-          REVIEW_STARTED_AT: ${{ steps.review_start.outputs.started_at }}\n         with:\n           github-token: ${{ secrets.GITHUB_TOKEN }}\n           script: |\n-            const webhookUrl = process.env.DISCORD_REVIEW_WEBHOOK_URL;\n-            const startedAt = new Date(process.env.REVIEW_STARTED_AT || 0);\n-            const { owner, repo } = context.repo;\n-            const pr = context.payload.pull_request;\n-            if (!webhookUrl || !pr) return;\n-\n-            const comments = await github.paginate(github.rest.pulls.listReviewComments, {\n-              owner,\n-              repo,\n-              pull_number: pr.number,\n-              per_page: 100,\n-            });\n-            const fresh = comments\n-              .filter((comment) => new Date(comment.created_at) >= startedAt)\n-              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));\n-            if (fresh.length === 0) {\n-              core.info('No new inline review comments to send to Discord.');\n-              return;\n-            }\n-\n-            const truncate = (value, max) => {\n-              const text = String(value || '');\n-              return text.length <= max ? text : `${text.slice(0, max - 1)}…`;\n+            const fs = require('node:fs');\n+            const provenance = JSON.parse(fs.readFileSync(`${process.env.RUNNER_TEMP}/kimi-provenance.json`, 'utf8'));\n+            // Keep complete coverage in the artifact; body metadata has a fixed field set.\n+            const bodyProvenance = {\n+              origin: provenance.origin, repository: provenance.repository,\n+              head: provenance.head, base: provenance.base, runtimeSha: provenance.runtimeSha,\n+              runtimeBlobSha256: provenance.runtimeBlobSha256,\n+              runtimeBaseAncestorVerified: provenance.runtimeBaseAncestorVerified,", :body "Handled: author walkthrough describes verified source merge/ancestry and red-green publication boundary. Actual source15 eligible approval5400237738 and17-test CI are recorded; current19-test regression suite passes. Current native37116238080 and eligible review remain pending, so this explanation is not an approval or model-pass claim."}]}}}, :live-pr {:number 14, :node_id "PR_kwDOR5O5HM8AAAABGXQN_A", :state "open", :draft false, :head {:sha "80fe32fc8c293ea4cd329e2740651fa45240f219", :repo {:full_name "open-hax/uxx", :private false, :id 1200863516, :node_id "R_kgDOR5O5HA"}}, :base {:sha "411b4cb56209433d83e0f55e0407cbb94627d853", :ref "main", :repo {:full_name "open-hax/uxx", :private false, :id 1200863516, :node_id "R_kgDOR5O5HA"}}}, :live-base {:ref "refs/heads/main", :node_id "REF_kwDOR5O5HK9yZWZzL2hlYWRzL21haW4", :url "https://api.github.com/repos/open-hax/uxx/git/refs/heads/main", :object {:sha "411b4cb56209433d83e0f55e0407cbb94627d853", :type "commit", :url "https://api.github.com/repos/open-hax/uxx/git/commits/411b4cb56209433d83e0f55e0407cbb94627d853"}}, :trigger {:html_url "https://github.com/open-hax/uxx/pull/14#issuecomment-5985900029", :performed_via_github_app nil, :author_association "MEMBER", :node_id "IC_kwDOR5O5HM8AAAABZMmV_Q", :minimized nil, :pin nil, :issue_url "https://api.github.com/repos/open-hax/uxx/issues/14", :updated_at "2026-10-05T00:10:22Z", :id 5985900029, :url "https://api.github.com/repos/open-hax/uxx/issues/comments/5985900029", :body "/opencode assess-actionability 80fe32fc8c293ea4cd329e2740651fa45240f219 PRRT_kwDOR5O5HM6omklO comment4172775340 proposal5985894261", :user {:html_url "https://github.com/riatzukiza", :gravatar_id "", :followers_url "https://api.github.com/users/riatzukiza/followers", :subscriptions_url "https://api.github.com/users/riatzukiza/subscriptions", :site_admin false, :user_view_type "public", :following_url "https://api.github.com/users/riatzukiza/following{/other_user}", :node_id "MDQ6VXNlcjEwNjc2OTI1", :type "User", :received_events_url "https://api.github.com/users/riatzukiza/received_events", :login "riatzukiza", :organizations_url "https://api.github.com/users/riatzukiza/orgs", :id 10676925, :events_url "https://api.github.com/users/riatzukiza/events{/privacy}", :url "https://api.github.com/users/riatzukiza", :repos_url "https://api.github.com/users/riatzukiza/repos", :starred_url "https://api.github.com/users/riatzukiza/starred{/owner}{/repo}", :gists_url "https://api.github.com/users/riatzukiza/gists{/gist_id}", :avatar_url "https://avatars.githubusercontent.com/u/10676925?u=00f2b2349e4bbf3e4d96a98ef5e5668e82bf7f77&v=4"}, :reactions {:heart 0, :eyes 0, :total_count 0, :-1 0, :hooray 0, :confused 0, :+1 0, :laugh 0, :url "https://api.github.com/repos/open-hax/uxx/issues/comments/5985900029/reactions", :rocket 0}, :created_at "2026-10-05T00:10:22Z"}, :comments [{:html_url "https://github.com/open-hax/uxx/pull/14#issuecomment-5985894261", :performed_via_github_app nil, :author_association "MEMBER", :node_id "IC_kwDOR5O5HM8AAAABZMl_dQ", :minimized nil, :issue_url "https://api.github.com/repos/open-hax/uxx/issues/14", :updated_at "2026-10-05T00:09:44Z", :id 5985894261, :url "https://api.github.com/repos/open-hax/uxx/issues/comments/5985894261", :body "Actionability proposal v1 for 80fe32fc8c293ea4cd329e2740651fa45240f219:\n[\"actionability/v1\" \"R_kgDOR5O5HA\" \"PR_kwDOR5O5HM8AAAABGXQN_A\" \"PRRT_kwDOR5O5HM6omklO\" 4172775340 \"f46aea71915e6577633a2363fc200e1a5399d339f0ae029c27cfbd56df3e50aa\" \"resolved-author-only-empty-reviews\"]", :user {:html_url "https://github.com/riatzukiza", :gravatar_id "", :followers_url "https://api.github.com/users/riatzukiza/followers", :subscriptions_url "https://api.github.com/users/riatzukiza/subscriptions", :site_admin false, :user_view_type "public", :following_url "https://api.github.com/users/riatzukiza/following{/other_user}", :node_id "MDQ6VXNlcjEwNjc2OTI1", :type "User", :received_events_url "https://api.github.com/users/riatzukiza/received_events", :login "riatzukiza", :organizations_url "https://api.github.com/users/riatzukiza/orgs", :id 10676925, :events_url "https://api.github.com/users/riatzukiza/events{/privacy}", :url "https://api.github.com/users/riatzukiza", :repos_url "https://api.github.com/users/riatzukiza/repos", :starred_url "https://api.github.com/users/riatzukiza/starred{/owner}{/repo}", :gists_url "https://api.github.com/users/riatzukiza/gists{/gist_id}", :avatar_url "https://avatars.githubusercontent.com/u/10676925?v=4"}, :reactions {:heart 0, :eyes 0, :total_count 0, :-1 0, :hooray 0, :confused 0, :+1 0, :laugh 0, :url "https://api.github.com/repos/open-hax/uxx/issues/comments/5985894261/reactions", :rocket 0}, :created_at "2026-10-05T00:09:44Z"} {:html_url "https://github.com/open-hax/uxx/pull/14#issuecomment-5985900029", :performed_via_github_app nil, :author_association "MEMBER", :node_id "IC_kwDOR5O5HM8AAAABZMmV_Q", :minimized nil, :issue_url "https://api.github.com/repos/open-hax/uxx/issues/14", :updated_at "2026-10-05T00:10:22Z", :id 5985900029, :url "https://api.github.com/repos/open-hax/uxx/issues/comments/5985900029", :body "/opencode assess-actionability 80fe32fc8c293ea4cd329e2740651fa45240f219 PRRT_kwDOR5O5HM6omklO comment4172775340 proposal5985894261", :user {:html_url "https://github.com/riatzukiza", :gravatar_id "", :followers_url "https://api.github.com/users/riatzukiza/followers", :subscriptions_url "https://api.github.com/users/riatzukiza/subscriptions", :site_admin false, :user_view_type "public", :following_url "https://api.github.com/users/riatzukiza/following{/other_user}", :node_id "MDQ6VXNlcjEwNjc2OTI1", :type "User", :received_events_url "https://api.github.com/users/riatzukiza/received_events", :login "riatzukiza", :organizations_url "https://api.github.com/users/riatzukiza/orgs", :id 10676925, :events_url "https://api.github.com/users/riatzukiza/events{/privacy}", :url "https://api.github.com/users/riatzukiza", :repos_url "https://api.github.com/users/riatzukiza/repos", :starred_url "https://api.github.com/users/riatzukiza/starred{/owner}{/repo}", :gists_url "https://api.github.com/users/riatzukiza/gists{/gist_id}", :avatar_url "https://avatars.githubusercontent.com/u/10676925?v=4"}, :reactions {:heart 0, :eyes 0, :total_count 0, :-1 0, :hooray 0, :confused 0, :+1 0, :laugh 0, :url "https://api.github.com/repos/open-hax/uxx/issues/comments/5985900029/reactions", :rocket 0}, :created_at "2026-10-05T00:10:22Z"}], :permission "admin"})

(defn captured-actor-fixture []
  (let [f captured-native-actors
        actual-policy (r/policy! (or (aget js/process.env "ASSESSMENT_POLICY")
                                    ".assessment-policy/skills/pr-flow"))]
    (assoc f :policy actual-policy :coverage coverage :authorized? true
           :comments (mapv #(r/native-comment % true) (:comments f))
           :event {:action "created" :repository {:full_name "open-hax/uxx" :private false}
                   :issue {:number 14 :pull_request {:url "captured-native-actor-fixture"}}
                   :comment (:trigger f)})))

(defn captured-actor-api [fixture calls posts]
  (fn [method endpoint _]
    (swap! calls conj [method endpoint])
    (cond
      (= endpoint "graphql")
      {:data {:repository (assoc (get-in fixture [:context :repository]) :pullRequest
                                  (assoc (get-in fixture [:context :pr]) :reviewThreads
                                         {:nodes [(get-in fixture [:context :thread])]
                                          :pageInfo {:hasNextPage false}}))}}
      (= endpoint "repos/open-hax/uxx/pulls/14") (:live-pr fixture)
      (= endpoint "repos/open-hax/uxx/git/ref/heads/main") (:live-base fixture)
      (= endpoint "repos/open-hax/uxx/issues/comments/5985900029") (:trigger fixture)
      (str/includes? endpoint "/comments?") (:comments fixture)
      (str/includes? endpoint "/permission") {:permission (:permission fixture)}
      :else (do (when (= method "POST") (swap! posts inc))
                (throw (js/Error. "Unexpected local captured-actor API call"))))))

(defn captured-actor-intake-observation [fixture]
  ;; Run the actual entrypoint, live collector and filesystem serializer; only
  ;; external reads are replaced. A throwing model/publisher spy must stay idle.
  (let [directory (fs/mkdtempSync (path/join (os/tmpdir) "uxx-native-actor-"))
        event-file (path/join directory "event.json") input-file (path/join directory "input.edn")
        settings {"ASSESSMENT_COMMAND" "intake"
                  "ASSESSMENT_POLICY" (or (aget js/process.env "ASSESSMENT_POLICY")
                                          ".assessment-policy/skills/pr-flow")
                  "GITHUB_EVENT_PATH" event-file
                  "ASSESSMENT_INPUT" input-file "ASSESSMENT_RESULT" (path/join directory "result.edn")}
        previous (into {} (for [[k _] settings] [k (aget js/process.env k)]))
        calls (atom []) posts (atom 0) models (atom 0) publishers (atom 0) coverage-calls (atom [])]
    (try
      (fs/writeFileSync event-file (js/JSON.stringify (clj->js (:event fixture))))
      (doseq [[k v] settings] (aset js/process.env k v))
      (let [failure (try
                      (with-redefs [r/gh-api! (captured-actor-api fixture calls posts)
                                    r/coverage! (fn [base head] (swap! coverage-calls conj [base head]) (:coverage fixture))
                                    r/model! (fn [& _] (swap! models inc) (throw (js/Error. "No fixture model")))
                                    r/publish! (fn [& _] (swap! publishers inc) (throw (js/Error. "No fixture App")))]
                        (r/main!))
                      nil (catch :default e (ex-message e)))
            exists (fs/existsSync input-file)
            frozen (when exists (edn/read-string (r/read-bounded input-file)))
            out {:failure failure :artifact exists :frozen frozen :coverage-calls @coverage-calls
                 :calls @calls :posts @posts :models @models :publishers @publishers}]
        (println "[captured-native-actor-intake]" (pr-str (dissoc out :frozen :calls)))
        out)
      (finally
        (doseq [[k v] previous]
          (if v (aset js/process.env k v) (js-delete js/process.env k)))
        (fs/rmSync directory #js {:recursive true :force true})))))

(deftest authentic-captured-actor-records-admit-with-raw-provenance
  (let [fixture (captured-actor-fixture)
        listed (second (:comments fixture)) direct (:trigger fixture)]
    (is (not= (get-in listed [:user :avatar_url]) (get-in direct [:user :avatar_url])))
    (is (= (select-keys (:user listed) [:id :node_id :login :type])
           (select-keys (:user direct) [:id :node_id :login :type])))
    ;; Exercise list/direct membership and a differing event/direct presentation.
    (doseq [event-comment [direct listed]]
      (let [observed (captured-actor-intake-observation (assoc-in fixture [:event :comment] event-comment))
            frozen (:frozen observed)]
        (is (nil? (:failure observed)) (:failure observed))
        (is (:artifact observed))
        (is (= [[(get-in fixture [:live-base :object :sha]) (get-in fixture [:context :pr :headRefOid])]]
               (:coverage-calls observed)))
        (is (zero? (:models observed))) (is (zero? (:publishers observed))) (is (zero? (:posts observed)))
        (when frozen
          (is (= (get-in fixture [:comments 0 :user]) (get-in frozen [:proposal :user])))
          (is (= (get-in direct [:user]) (get-in frozen [:trigger :user])))
          (is (= (:coverage fixture) (:coverage frozen)))
          (is (= (r/comment-tuple direct) (get-in frozen [:identity 3])))
          (is (= :ineligible (:status (a/disposition (:target frozen))))))))))

(deftest native-actor-tuples-require-complete-authoritative-fields
  (let [comment (:trigger (captured-actor-fixture)) actor (:user comment)
        malformed [(dissoc actor :id) (assoc actor :id 0) (assoc actor :id -1) (assoc actor :id 1.5) (assoc actor :id "10676925")
                   (assoc actor :id (+ js/Number.MAX_SAFE_INTEGER 1))
                   (dissoc actor :node_id) (assoc actor :node_id nil) (assoc actor :node_id " ") (assoc actor :node_id 10676925)
                   (dissoc actor :login) (assoc actor :login nil) (assoc actor :login " ") (assoc actor :login 10676925)
                   (dissoc actor :type) (assoc actor :type nil) (assoc actor :type "Organization")]]
    (doseq [bad malformed]
      (is (refuses? #(r/comment-tuple (assoc comment :user bad)))))
    ;; Native App identities remain supported by the same transport tuple;
    ;; publication still has its unchanged explicit canonical/App guards.
    (is (not (refuses? #(r/comment-tuple (assoc comment :user bot)))))))

(deftest native-actor-and-comment-mutations-still-refuse-before-input-write
  (let [fixture (captured-actor-fixture)
        changed [(assoc-in fixture [:trigger :user :id] 10676926)
                 (assoc-in fixture [:trigger :user :node_id] "MDQ6VXNlcjEwNjc2OTI2")
                 (assoc-in fixture [:trigger :user :login] "other-writer")
                 (assoc-in fixture [:trigger :user :type] "Bot")
                 (assoc-in fixture [:comments 0 :user :id] 10676926)
                 (assoc-in fixture [:comments 0 :user :node_id] "MDQ6VXNlcjEwNjc2OTI2")
                 (assoc-in fixture [:comments 0 :user :login] "other-writer")
                 (assoc-in fixture [:comments 0 :user :type] "Bot")
                 (assoc-in fixture [:comments 1 :id] 5985900030)
                 (assoc-in fixture [:comments 1 :node_id] "IC_other_trigger")
                 (update-in fixture [:comments 1 :body] str "\n")
                 (assoc-in fixture [:comments 1 :created_at] "2026-10-05T00:10:21Z")
                 (assoc-in fixture [:comments 1 :updated_at] "2026-10-05T00:10:23Z")
                 (assoc-in fixture [:comments 1 :html_url] "https://github.com/open-hax/uxx/pull/14#issuecomment-5985900030")
                 (assoc-in fixture [:event :comment :id] 5985900030)
                 (assoc-in fixture [:event :comment :node_id] "IC_other_trigger")
                 (update-in fixture [:event :comment :body] str "\n")
                 (assoc-in fixture [:event :comment :created_at] "2026-10-05T00:10:21Z")
                 (assoc-in fixture [:event :comment :updated_at] "2026-10-05T00:10:23Z")
                 (assoc-in fixture [:event :comment :html_url] "https://github.com/open-hax/uxx/pull/14#issuecomment-5985900030")]]
    (doseq [bad changed]
      (let [observed (captured-actor-intake-observation bad)]
        (is (some? (:failure observed))) (is (false? (:artifact observed)))
        (is (empty? (:coverage-calls observed)))
        (is (zero? (:models observed))) (is (zero? (:publishers observed))) (is (zero? (:posts observed)))))))

(def unrelated-null-actor
  (fixture-comment 9001001 "Unrelated ordinary comment; no protocol header."
                   "2026-10-05T00:10:23Z" nil))

(deftest unrelated-native-actor-does-not-bind-selected-intake
  (let [fixture (captured-actor-fixture)]
    (doseq [rows [(vec (cons unrelated-null-actor (:comments fixture)))
                 (conj (:comments fixture) unrelated-null-actor)]]
      (let [observed (captured-actor-intake-observation (assoc fixture :comments rows))]
        (is (nil? (:failure observed))) (is (true? (:artifact observed)))
        (is (= 1 (count (:coverage-calls observed))))
        (is (zero? (:models observed))) (is (zero? (:publishers observed))) (is (zero? (:posts observed)))
        (when-let [frozen (:frozen observed)]
          (is (= (mapv :id rows) (mapv :id (get-in frozen [:target :issue-comments]))))
          (is (nil? (get-in (first (filter #(= 9001001 (:id %)) (get-in frozen [:target :issue-comments]))) [:user])))
          (is (= 5985894261 (:proposal-id (a/disposition (:target frozen))))))))))

(deftest unrelated-native-actor-does-not-bind-publication-membership
  ;; Actual publisher guard with synthetic existing native-seam API only.
  ;; One simulated POST is expected; no actual App/native/provider execution.
  (doseq [alter-rows [#(vec (cons unrelated-null-actor %))
                     #(conj % unrelated-null-actor)
                     #(vec (concat (take 2 %) [unrelated-null-actor] (drop 2 %)))]]
    (let [{:keys [run calls]} (native-seam "informational" identity alter-rows)
          out (try (run) (catch :default _ nil))]
      (is (= 7004 (:native-id out)))
      (is (= :complete (:publication-state out)))
      (is (= :qualified (get-in out [:disposition :status])))
      (is (= 1 (count (filter #(= ["POST" "repos/open-hax/uxx/issues/14/comments"] (subvec % 0 2)) @calls)))))))

(deftest selected-membership-still-requires-complete-native-binding
  (let [fixture (captured-actor-fixture)
        bad-actors [nil (dissoc user :id) (assoc user :id (+ js/Number.MAX_SAFE_INTEGER 1))
                    (dissoc user :node_id) (dissoc user :login) (assoc user :type "Organization")]]
    (doseq [index [0 1] actor bad-actors]
      (let [bad (-> fixture
                    (assoc-in [:comments index :user] actor)
                    (update :comments #(vec (cons unrelated-null-actor %))))
            observed (captured-actor-intake-observation bad)]
        (is (some? (:failure observed))) (is (false? (:artifact observed)))
        (is (zero? (:models observed))) (is (zero? (:publishers observed))) (is (zero? (:posts observed))))))
  ;; Both published readback and original trigger must still match by all tuple
  ;; fields even when an unrelated null actor occurs before either selected row.
  (doseq [selected-id [7002 7004]
          mutation [#(assoc % :user nil)
                    #(assoc-in % [:user :id] (+ js/Number.MAX_SAFE_INTEGER 1))
                    #(update % :id inc) #(assoc % :node_id "IC_changed")
                    #(update % :body str " changed") #(assoc % :created_at "2026-10-05T00:10:24Z")
                    #(assoc % :updated_at "2026-10-05T00:10:24Z")
                    #(assoc % :html_url "https://github.com/open-hax/uxx/pull/14#issuecomment-9001002")
                    #(assoc-in % [:user :node_id] "NODE_changed")
                    #(assoc-in % [:user :login] "other-writer")
                    #(assoc-in % [:user :type] "Organization")]]
    (let [alter-rows #(vec (cons unrelated-null-actor
                                (map (fn [c] (if (= selected-id (:id c)) (mutation c) c)) %)))
          {:keys [run calls]} (native-seam "informational" identity alter-rows)]
      (is (refuses? run))
      (is (= 1 (count (filter #(= ["POST" "repos/open-hax/uxx/issues/14/comments"] (subvec % 0 2)) @calls)))))))

(defmethod test/report [:cljs.test/default :end-run-tests] [summary]
  (when (pos? (+ (:fail summary) (:error summary))) (set! (.-exitCode js/process) 1)))

(deftest model-failure-reporter-retains-only-bounded-native-phase
  (let [fallback "Scoped assessment failed closed; no qualification claimed"
        report! (fn [error]
                  (r/failure-message error))]
    (doseq [phase ["startup" "capability" "session" "events" "submit" "status" "messages" "validation"]]
      (let [error (js/Error. "SYNTHETIC_SECRET_MARKER raw provider response must not escape")]
        (aset error "phase" phase)
        (is (= (str "Scoped assessment failed closed at native model phase " phase "; no qualification claimed")
               (report! error)))))
    (doseq [phase [nil "SYNTHETIC_SECRET_MARKER" "validation\nSYNTHETIC_SECRET_MARKER" :validation 42 {}]]
      (let [error (js/Error. "SYNTHETIC_SECRET_MARKER")]
        (aset error "phase" phase)
        (is (= fallback (report! error)))))
    (let [error (js/Error. "Kimi model execution exceeded the bounded 20-minute budget")]
      (aset error "phase" "messages")
      (is (= "Scoped assessment failed closed at the native model deadline; no qualification claimed" (report! error))))
    ;; Both entry-point catches invoke the named effectful handler tested below.
    ))


(deftest failed-input-retention-condition-is-bounded-to-admitted-failures
  (let [source (fs/readFileSync ".github/workflows/opencode-issue-agent.yml" "utf8")
        block (second (re-find #"(?s)- name: Retain admitted input after a failed model step\n(.*?)\n  scoped-assessment-publish:" source))
        expression (second (re-find #"if: \$\{\{ (.*?) \}\}" (or block "")))
        evaluate (when expression (js/Function. "failure" "steps"
                       (str "return (" (-> expression (str/replace "steps.native-input" "steps['native-input']")
                                           (str/replace "steps.model-assessment" "steps['model-assessment']")
                                           (str/replace " == " " === ")) ");")))]
    (is (some? evaluate))
    ;; This local expression fixture follows documented steps.outcome/status values;
    ;; it does not claim actual hosted failure-artifact execution.
    (is (str/includes? source
          "- name: Produce independent structured assessment with read-only tools\n        id: model-assessment\n"))
    (doseq [failed? [false true]
            outcome ["success" "failure" "skipped" "cancelled" nil]
            model-outcome ["success" "failure" "skipped" "cancelled" nil]]
      (is (= (and failed? (= "success" outcome) (= "failure" model-outcome))
             (boolean (when evaluate
                        (evaluate (fn [] failed?)
                          #js {"native-input" #js {:outcome outcome}
                               "model-assessment" #js {:outcome model-outcome}}))))
          (str "job failure=" failed? "; admitted input=" outcome "; model=" model-outcome)))
    (is (str/includes? (or block "") "path: ${{ runner.temp }}/assessment-input.edn"))
    (is (str/includes? (or block "") "if-no-files-found: error"))
    (is (not (str/includes? (or block "") "assessment-result.edn")))))


(deftest failure-handler-reports-bounded-input-and-unsuccessful-exit
  (let [saved (.-exitCode js/process)
        error (js/Error. "SYNTHETIC_SECRET_MARKER")
        observed (atom [])]
    (try
      (set! (.-exitCode js/process) 0)
      (let [output (with-out-str (r/report-failure! error))]
        (is (= "Scoped assessment failed closed; no qualification claimed\n" output))
        (is (= 1 (.-exitCode js/process))))
      (set! (.-exitCode js/process) 0)
      (with-redefs [r/failure-message (fn [input] (swap! observed conj input) "bounded test response")]
        (is (= "bounded test response\n" (with-out-str (r/report-failure! error)))))
      (is (= [error] @observed))
      (is (= 1 (.-exitCode js/process)))
      (finally (set! (.-exitCode js/process) saved)))))

(deftest top-level-synchronous-and-promise-failures-retain-exit-one
  (async done
    (let [saved (.-exitCode js/process)
          error (js/Error. "SYNTHETIC_SECRET_MARKER")]
      (set! (.-exitCode js/process) 0)
      (is (= "Scoped assessment failed closed; no qualification claimed\n"
             (with-out-str (r/run-main! #(throw error)))))
      (is (= 1 (.-exitCode js/process)))
      (set! (.-exitCode js/process) 0)
      (-> (r/run-main! #(js/Promise.reject error))
          (.then (fn [_]
                   (is (= 1 (.-exitCode js/process)))
                   (set! (.-exitCode js/process) saved)
                   (done)))
          (.catch (fn [_]
                    (is false "The rejection handler must consume failure and set exit one")
                    (set! (.-exitCode js/process) saved)
                    (done)))))))

(run-tests)
