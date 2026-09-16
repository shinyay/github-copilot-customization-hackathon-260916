import {
  ISSUE_FORM_FIELD_CONTRACT,
  OPTIONAL_ACTIVITY_OPTIONS,
  OPTIONAL_ISSUE_FORM_FIELD_CONTRACT,
  REQUIRED_ISSUE_FORM_FIELDS,
  REQUIRED_OUTCOME_OPTIONS,
} from "./constants.mjs";

function addError(errors, code, message) {
  errors.push({ code, message });
}

function fieldOptions(contents, fieldId) {
  const block = contents.match(
    new RegExp(
      `^    id:\\s*${fieldId}\\s*$([\\s\\S]*?)(?=^  - type:|(?![\\s\\S]))`,
      "mu",
    ),
  )?.[1];
  const optionBlock = block?.match(
    /^      options:\s*$([\s\S]*?)(?=^    validations:)/mu,
  )?.[1];
  if (!optionBlock) {
    return [];
  }
  return [...optionBlock.matchAll(/^        - ([^\r\n]+)$/gmu)].map(
    (match) => match[1].trim(),
  );
}

export function validateIssueFormText(contents, expectedChallengeIds) {
  const errors = [];

  for (const fieldId of [
    ...REQUIRED_ISSUE_FORM_FIELDS,
    ...OPTIONAL_ISSUE_FORM_FIELD_CONTRACT.map(([id]) => id),
  ]) {
    const pattern = new RegExp(
      `^\\s*id:\\s*${fieldId.replaceAll("-", "\\-")}\\s*$`,
      "mu",
    );
    const occurrences = contents.match(new RegExp(pattern.source, "gmu"))?.length ?? 0;
    if (occurrences === 0) {
      addError(
        errors,
        `ISSUE_FIELD_MISSING:${fieldId}`,
        `Issue Form is missing field id: ${fieldId}`,
      );
    } else if (occurrences !== 1) {
      addError(errors, "ISSUE_FIELD_DUPLICATE", `Issue Form field must be unique: ${fieldId}`);
    }
  }

  for (const [fieldId, type, label, required] of [
    ...ISSUE_FORM_FIELD_CONTRACT.map((field) => [...field, true]),
    ...OPTIONAL_ISSUE_FORM_FIELD_CONTRACT.map((field) => [...field, false]),
  ]) {
    const blockPattern = new RegExp(
      `- type:\\s*${type}\\s*\\n\\s*id:\\s*${fieldId}\\s*\\n(?:(?!\\n\\s*- type:)[\\s\\S])*?\\n\\s*label:\\s*${label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\s*$`,
      "mu",
    );
    if (!blockPattern.test(contents)) {
      addError(
        errors,
        `ISSUE_FIELD_CONTRACT:${fieldId}`,
        `Issue Form field ${fieldId} must be type ${type} with label "${label}"`,
      );
    }
    const block = contents.match(
      new RegExp(`^    id:\\s*${fieldId}\\s*$([\\s\\S]*?)(?=^  - type:|(?![\\s\\S]))`, "mu"),
    )?.[1] ?? "";
    if (
      !new RegExp(`^    validations:\\s*\\n      required: ${required}\\s*$`, "mu").test(block)
    ) {
      addError(
        errors,
        required ? "ISSUE_REQUIRED_VALIDATION" : "ISSUE_OPTIONAL_VALIDATION",
        `Issue Form ${fieldId} must declare validations.required: ${required}`,
      );
    }
  }

  const outcomeOptions = fieldOptions(contents, "outcome");
  if (
    JSON.stringify(outcomeOptions) !== JSON.stringify(REQUIRED_OUTCOME_OPTIONS)
  ) {
    addError(
      errors,
      "ISSUE_OUTCOME_OPTIONS",
      `Issue Form outcome options must be exactly ${REQUIRED_OUTCOME_OPTIONS.join(", ")}`,
    );
  }

  if (
    JSON.stringify(fieldOptions(contents, "optional_status")) !==
    JSON.stringify(OPTIONAL_ACTIVITY_OPTIONS)
  ) {
    addError(
      errors,
      "ISSUE_OPTIONAL_STATUS_OPTIONS",
      `Optional activity options must be exactly ${OPTIONAL_ACTIVITY_OPTIONS.join(", ")}`,
    );
  }

  if (!Array.isArray(expectedChallengeIds)) {
    addError(
      errors,
      "ISSUE_CHALLENGE_EXPECTED_IDS",
      "Issue Form validation requires the published IDs derived from the catalog",
    );
  } else if (
    JSON.stringify(fieldOptions(contents, "challenge_id")) !==
    JSON.stringify(expectedChallengeIds)
  ) {
    addError(
      errors,
      "ISSUE_CHALLENGE_OPTIONS",
      `Issue Form Challenge ID options must be exactly ${expectedChallengeIds.join(", ")}`,
    );
  }

  if (
    !contents.includes(
      "Optional guide/activity records do not count as core improvement or Runtime verification success. They may remain unperformed.",
    )
  ) {
    addError(errors, "ISSUE_OPTIONAL_SEPARATION", "Issue Form must explain the optional/core evidence boundary");
  }

  return errors;
}
