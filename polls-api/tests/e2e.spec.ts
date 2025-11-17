import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

test('create poll -> vote -> read results', async ({ request }) => {
  // Create poll
  const createResp = await request.post(`${BASE}/api/createPoll`, {
    data: { question: 'Playwright test poll', options: ['Option A', 'Option B', 'Option C'] },
  });
  expect(createResp.status()).toBe(201);
  const poll = await createResp.json();
  expect(poll.id).toBeTruthy();
  expect(poll.options).toHaveLength(3);

  // Vote on first option
  const optionId = poll.options[0].id;
  const voteResp = await request.post(`${BASE}/api/vote`, {
    data: { pollId: poll.id, optionId: optionId },
  });
  expect(voteResp.status()).toBe(204);

  // Get poll and verify vote was counted
  const getResp = await request.get(`${BASE}/api/getPoll?id=${poll.id}`);
  expect(getResp.status()).toBe(200);
  const updated = await getResp.json();
  const votedOption = updated.options.find((o: any) => o.id === optionId);
  expect(votedOption.votes).toBe(1);
});
