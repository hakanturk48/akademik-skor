const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const hub = read('src/components/student/ListeningLearningHub.tsx');
const practice = read('src/components/student/ListeningPractice.tsx');
const data = read('src/lib/listening/data.ts');
const service = read('src/lib/listening/service.ts');
const registry = read('src/lib/navigation/registry.ts');
const navigation = read('src/lib/navigation/data/navigation.json');
const route = read('src/app/listening.tsx');
const practiceRoute = read('src/app/practice/listening.tsx');

[
  'Listening Mastery',
  'Practice This Week',
  'Weakest Subskill',
  'Recent Best',
  'Quick Listening',
  'Focused Practice',
  'Full Section Practice',
  'Review Mistakes',
  'Choose a Response',
  'Conversation',
  'Announcement',
  'Academic Talk',
  'Main Idea',
  'Purpose',
  'Detail',
  'Inference',
  'Attitude',
  'Function',
  'Note Taking',
  'Adaptive',
  'Easy',
  'Medium',
  'Hard',
  'Quick',
  'Standard',
  'Extended',
].forEach((token) => {
  if (!data.includes(token) && !hub.includes(token)) fail(`Missing listening taxonomy token: ${token}`);
});

[
  'ContinueLearningCard',
  'RecommendationList',
  'FocusedPracticeWizard',
  'LearningChainCard',
  'SessionRulesCard',
  'createListeningPracticeHref',
].forEach((token) => {
  if (!hub.includes(token) && !service.includes(token)) fail(`Missing hub/service behavior: ${token}`);
});

if (!registry.includes("route: '/listening'")) fail('Navigation registry does not point Listening to /listening.');
if (!registry.includes("'/practice/listening'")) fail('Navigation registry does not keep practice route active for Listening.');
if (!navigation.includes('"route": "/listening"')) fail('Navigation JSON does not point Listening to /listening.');
if (!route.includes('ListeningLearningHub')) fail('/listening route does not render the Listening Hub.');
if (!practiceRoute.includes('ListeningPractice')) fail('Existing /practice/listening route no longer renders ListeningPractice.');

[
  'useLocalSearchParams',
  'ModeBanner',
  'MobilePanelToggle',
  'OutlinePanel compact',
  'Practice mode',
  'Exam mode',
].forEach((token) => {
  if (!practice.includes(token)) fail(`Missing practice responsive/mode token: ${token}`);
});

if (!process.exitCode) {
  console.log('Listening hub validation passed.');
}
