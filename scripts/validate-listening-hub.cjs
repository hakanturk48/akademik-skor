const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const hub = read("src/components/student/ListeningLearningHub.tsx");
const hubContent = read("src/lib/listening/hub-content.ts");
const practice = read("src/components/student/ListeningPractice.tsx");
const data = read("src/lib/listening/data.ts");
const service = read("src/lib/listening/service.ts");
const registry = read("src/lib/navigation/registry.ts");
const navigation = read("src/lib/navigation/data/navigation.json");
const route = read("src/app/listening.tsx");
const practiceRoute = read("src/app/practice/listening.tsx");

[
  "Listening Mastery",
  "Practice This Week",
  "Weakest Subskill",
  "Recent Best",
  "Quick Listening",
  "Focused Practice",
  "Full Section Practice",
  "Review Mistakes",
  "Choose a Response",
  "Conversation",
  "Announcement",
  "Academic Talk",
  "Main Idea",
  "Purpose",
  "Detail",
  "Inference",
  "Attitude",
  "Function",
  "Note Taking",
  "Adaptive",
  "Easy",
  "Medium",
  "Hard",
  "Quick",
  "Standard",
  "Extended",
].forEach((token) => {
  if (!data.includes(token) && !hub.includes(token)) fail("Missing listening taxonomy token: " + token);
});

[
  "ContinueLearningCard",
  "RecommendationList",
  "FocusedPracticeWizard",
  "LearningChainCard",
  "SessionRulesCard",
  "createListeningPracticeHref",
  "getListeningHubItems",
  "syncPublishedListeningHubItems",
  "getListeningHubItemById",
].forEach((token) => {
  if (!hub.includes(token) && !service.includes(token) && !hubContent.includes(token)) fail("Missing hub/service behavior: " + token);
});

if (!hub.includes("Topic-Based Listening")) fail("Listening page must render topic-based published entries.");
if (!hubContent.includes("loadRemotePublishedWorkspaceState")) fail("Listening Hub must read the published Firebase workspace.");
if (!hubContent.includes("published-workspace.v1")) fail("Listening Hub must use the shared published workspace cache.");
if (!hubContent.includes("&hub=")) fail("Listening Hub cards must carry the published hub item id into practice.");
if (!practice.includes("getVideoEmbedUrl") || !practice.includes("TRANSCRIPT PREVIEW") || !practice.includes("Listening source")) fail("Listening practice must render published media, outline, and transcript metadata.");
if (hub.includes("ProgressRecommendationList")) fail("Listening Hub should not depend on student progress recommendations for published topic entries.");
if (!/route: .\/listening./.test(registry)) fail("Navigation registry does not point Listening to /listening.");
if (!/.\/practice\/listening./.test(registry)) fail("Navigation registry does not keep practice route active for Listening.");
if (!navigation.includes("/listening")) fail("Navigation JSON does not point Listening to /listening.");
if (!route.includes("ListeningLearningHub")) fail("/listening route does not render the Listening Hub.");
if (!practiceRoute.includes("ListeningPractice")) fail("Existing /practice/listening route no longer renders ListeningPractice.");

[
  "useLocalSearchParams",
  "ModeBanner",
  "LectureResourcesPanel",
  "MobilePanelToggle",
  "OutlinePanel compact",
  "Practice mode",
  "Exam mode",
  "getToeflListeningQuestionLimitSeconds",
].forEach((token) => {
  if (!practice.includes(token)) fail("Missing practice responsive/mode token: " + token);
});

if (!process.exitCode) {
  console.log("Listening hub validation passed.");
}
