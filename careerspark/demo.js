import {
  analyzeJobDescription,
  createOpeningInterviewMessage,
  matchResumeToJob,
  respondToInterviewAnswer,
} from './career-analysis.js';

const byId = (id) => document.getElementById(id);
const jd = byId('jd');
const resume = byId('resume');
const answerForm = byId('answer-form');
const answer = byId('answer');
const output = (id, content) => { byId(id).textContent = content; };
let analysis = null;
let match = null;
let messages = [];

function clearInterview() {
  messages = [];
  answerForm.hidden = true;
  answer.value = '';
  output('question', '');
  output('feedback', '');
}

byId('example').addEventListener('click', () => {
  jd.value = 'Data Analyst Intern\nExample Company\nLocation: Shenzhen\nWork with SQL, Python and Excel to analyze customer data and present findings.';
  resume.value = 'Used SQL and Python to analyze 2,000 customer records, reducing monthly reporting time by 20%. Presented results to stakeholders.';
  jd.focus();
});

byId('jd-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const text = jd.value.trim();
  if (!text) return output('jd-result', '请输入有效的岗位描述。');
  analysis = analyzeJobDescription(text);
  match = null;
  clearInterview();
  output('resume-result', '');
  output('jd-result', [
    analysis.title,
    `技能关键词　${analysis.keySkills.join('、')}`,
    ...analysis.strategy.map(({ action, tip }) => `${action} — ${tip}`),
  ].join('\n'));
});

byId('resume-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!analysis) return output('resume-result', '请先分析上方的岗位描述。');
  const text = resume.value.trim();
  if (!text) return output('resume-result', '请粘贴简历正文。');
  match = matchResumeToJob(text, analysis);
  clearInterview();
  output('resume-result', [
    `规则匹配度　${match.score}/100`,
    `已覆盖　${match.matchedSkills.join('、') || '无'}`,
    `待补充　${match.missingSkills.join('、') || '无'}`,
    ...match.suggestions.map(({ description }) => description),
  ].join('\n'));
});

byId('start').addEventListener('click', () => {
  clearInterview();
  const opening = createOpeningInterviewMessage('the target role', 'targeted', analysis, match);
  messages = [opening];
  output('question', opening.content);
  answerForm.hidden = false;
  answer.focus();
});

answerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = answer.value.trim();
  if (!text || !messages.length) return;
  const reply = respondToInterviewAnswer(text, messages, analysis, match);
  messages.push({ role: 'user', content: text }, reply);
  output('question', reply.content);
  output('feedback', reply.feedback ?? '');
  answer.value = '';
  answer.focus();
});
