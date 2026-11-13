import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("a complete local learning journey persists across reloads", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s begin", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Asha");
  await page
    .getByRole("button", { name: "Start my journey", exact: true })
    .click();
  await expect(page.getByText(/Good .*Asha/)).toBeVisible();
  await page.screenshot({ path: "/tmp/bolofluent-home.png", fullPage: true });
  await page.getByRole("button", { name: /YOUR NEXT LESSON/ }).click();
  await page
    .getByRole("button", { name: "Try a quick check", exact: true })
    .click();
  await page.getByRole("button", { name: /My name is Asha/ }).click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.getByRole("button", { name: /I am from India/ }).click();
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  await page.getByRole("button", { name: /Nice to meet you/ }).click();
  await page
    .getByRole("button", { name: "Finish lesson", exact: true })
    .click();
  await expect(
    page.getByText("You answered 3 of 3 questions correctly."),
  ).toBeVisible();
  await page.goto("/vocabulary");
  await page
    .getByRole("button", { name: "Reveal meaning", exact: true })
    .click();
  await page.getByRole("button", { name: "Got it!", exact: true }).click();
  await expect(page.getByText(/1 WORDS EXPLORED/i)).toBeVisible();
  await page.goto("/grammar");
  await page
    .getByRole("textbox", { name: "Sentence to check" })
    .fill("I am agree with you.");
  await page
    .getByRole("button", { name: "Check my sentence", exact: true })
    .click();
  await expect(
    page.getByText("I agree with you.", { exact: true }),
  ).toBeVisible();
  await page.goto("/conversation/cafe");
  await page
    .getByRole("textbox", { name: "Your conversation reply" })
    .fill("I would like a cup of tea, please.");
  await page
    .getByRole("button", { name: "Send my reply", exact: true })
    .click();
  await expect(
    page.getByText("Would you like anything to eat with that?", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page.goto("/");
  await expect(page.getByText(/Good .*Asha/)).toBeVisible();
  const data = await page.evaluate(
    () => JSON.parse(localStorage.getItem("bolofluent-v1")!).state,
  );
  expect(
    data.activities.filter((a: { type: string }) => a.type === "lesson"),
  ).toHaveLength(1);
  expect(data.activities[0].score).toBe(100);
  expect(data.reviews).toHaveLength(1);
  expect(data.conversations[0].messages).toHaveLength(3);
  await page.getByRole("tab", { name: "Profile" }).click();
  await page
    .getByRole("button", { name: "Clear conversation history", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByText("Conversation history cleared.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete my local profile", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Let’s begin", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("backup export, validation, and confirmed restore preserve learning data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s begin", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Asha");
  await page
    .getByRole("button", { name: "Start my journey", exact: true })
    .click();
  await page.getByRole("tab", { name: "Profile" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export my backup", exact: true })
    .click();
  const downloaded = await downloadEvent;
  const backup = await readFile((await downloaded.path())!);
  expect(JSON.parse(backup.toString()).state.profile.name).toBe("Asha");
  await page.getByRole("textbox", { name: "Update name" }).fill("Riya");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByText("Name updated.", { exact: true })).toBeVisible();
  const invalidFile = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Restore a backup", exact: true })
    .click();
  await (
    await invalidFile
  ).setFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"app":"Unknown"}'),
  });
  await expect(page.getByRole("textbox", { name: "Update name" })).toHaveValue(
    "Riya",
  );
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Restore a backup", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "BoloFluent-backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  await expect(
    page.getByText("Restore this backup?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Update name" })).toHaveValue(
    "Asha",
  );
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Update name" })).toHaveValue(
    "Asha",
  );
});

test("microphone recording and playback work without fabricated transcription", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s begin", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your name", exact: true })
    .fill("Asha");
  await page
    .getByRole("button", { name: "Start my journey", exact: true })
    .click();
  await page.goto("/pronunciation");
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(page.getByText(/RECORDING · [1-9]/)).toBeVisible();
  await page
    .getByRole("button", { name: "Stop recording", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Listen to my recording", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Offline speech recognition is not installed/),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Your spoken or typed sentence" }),
  ).toHaveValue("");
  await page
    .getByRole("button", { name: "Listen to my recording", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your spoken or typed sentence" })
    .fill("I am learning something new every day.");
  await page
    .getByRole("button", { name: "Compare my words", exact: true })
    .click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(
    page.getByText("TYPED WORD MATCH", { exact: true }),
  ).toBeVisible();
});
