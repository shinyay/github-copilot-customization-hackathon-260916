# GitHub Copilot Customization Scenarios

**Language:** [日本語](../README.md) / **English**

> **GitHub Pages (after it is enabled):** [Open the bilingual site](https://shinyay.github.io/github-copilot-customization-hackathon-260916/en/). It shows Japanese by default at the site root and provides a prominent **日本語 / English** switch on every published page.

The Pages toggle stores your language choice in the browser. It still works as a normal link when JavaScript or browser storage is unavailable. On GitHub, use the **Language** link at the top of each Markdown document to open the matching translation.

The site uses only Jekyll plugins bundled with GitHub Pages. It adds no Node package, Gemfile, or GitHub Actions build workflow.

This public repository helps you learn GitHub Copilot customization features through 45 scenarios based on realistic work.

This repository provides only scenario explanations and inactive samples. You create the repository, place the samples, and run Copilot in your own working repository. You do not need to submit results through an Issue or Pull Request in this repository.

## What's included

- Repository Instructions, Path-specific Instructions, AGENTS.md, and CLAUDE.md
- Prompt Files, Custom Agents, Subagents, Agent Skills, and Hooks
- MCP, Tool Sets, Copilot Spaces, and Agent Plugins
- Context, Memory, Model, Permissions, and Sandbox
- GitHub Copilot code review, Cloud Agent, and cloud customization
- Customization evaluation, staged rollout, diagnostics, and safe operational design

Choose a feature that interests you or a challenge close to your work from the [scenario list](challenges/README.md). Every scenario can be tried independently.

## Getting started

### 1. Choose a scenario

Choose one item from the [scenario list](challenges/README.md) and read its entire README first. You do not need to complete any earlier scenario.

### 2. Create a working repository

Open [`shinyay/github-copilot-customization-runtime-template`](https://github.com/shinyay/github-copilot-customization-runtime-template), then use **Use this template** to create your own repository.

Unless you have a specific reason not to, choose a private repository so that you do not publish real code, conversations, logs, or customization settings. Using a new working repository for each scenario makes it easier to avoid effects from earlier settings or conversations.

The helper scripts and legacy event-operation files included in the Runtime template are not used by this scenario collection. Work only with the source specified by each README and the `starter/` materials that you place manually.

When a scenario specifies a fixed revision, that value is the upstream revision in the public Runtime template. A repository created with **Use this template** has a new Git history, so its local `HEAD` is not required to match the upstream revision.

### 3. Refer to this repository

You can read it in a browser or clone it locally.

```console
git clone https://github.com/shinyay/github-copilot-customization-hackathon-260916.git copilot-customization-scenarios
```

Each scenario's `starter/` directory contains fixed inputs, fixtures, code excerpts, customization examples, verification worksheets, and similar materials. Copy only the files specified by the README into your working repository.

Files ending in `*.template` are intentionally inactive. Check the destination and filename in the README, and remove the suffix only inside your working repository when required. Do not activate them directly in this public repository or copy an entire `starter/` directory in bulk.

### 4. Try it

Use Copilot by following the scenario's fixed task and procedure. If you want to compare results before and after enabling a feature, use **Optional: Compare** in that README.

The comparison is a self-check for learning. There is no run ID, common Evidence format, or external submission. In your own notes, record only the differences that could affect results, such as the input, model, tools, and conversation state.

### 5. Clean up

Stop any MCP servers, watchers, development servers, or similar processes you started. Organize working repositories and temporary data you no longer need according to your own operational rules.

## Principles

- **Scenario first**: Start with a real-world difficulty rather than a feature catalog.
- **Explain feature limits**: State what a feature is suitable for and what it does not guarantee.
- **Understand the manual steps**: You confirm placement and execution instead of relying on automatic injection or automatic submission.
- **Do not predetermine the result**: No improvement, a worse result, or an unavailable feature are all valid learning outcomes.
- **Prioritize safety**: Do not bring secrets, personal information, customer data, private source, or unapproved external operations into the learning materials.

## Repository structure

```text
_config.yml             # Minimal Jekyll configuration for GitHub Pages
_layouts/default.html   # Shared language toggle for every page
assets/                 # Lightweight CSS and JavaScript for Pages
en/                     # English versions of public Markdown documents
challenges/
├── README.md          # List of 45 scenarios
└── hc-xxx/
    ├── README.md      # Scenario, feature explanation, procedure, and verification points
    ├── starter/       # Inactive samples used manually
    └── optional/      # Advanced and supplemental guides, when present
```

See [Contributing](CONTRIBUTING.md) when adding or updating a scenario.

## Safety

- Do not commit tokens, credentials, personal information, customer data, private source, or raw logs.
- When working with an external service, organization settings, permissions, billing, or cloud execution, confirm the target and impact and obtain the required approval.
- If a UI or feature is unavailable, do not claim success by using a different feature. Check differences in environment, entitlement, client, host, and release channel.
- A fallback does not necessarily reproduce the same feature. Separate what you could compare manually from what you could no longer verify.
