<div align="center">
    <h1>Commandly</h1>
    <img src="public/apple-touch-icon.png" alt="commandly" width="200px">
</div>

<h4 align="center">A user-friendly way to generate CLI commands using UI. Quickly turn help text from any CLI tool into UI using AI.</h4>
     
<p align="center">
  <a href="#features">Features</a> •
  <a href="#contributing">Contribute</a> •
  <a href="https://buymeacoffee.com/divyeshio" target="_blank">Sponsor</a> •
  <a href="#license">License</a> •
</p>

## ✨ Features

<h1 align="center">
  <img src="public/images/ui.png" alt="commandly-ui" width="720px">
  <img src="public/images/tool-editor.png" alt="commandly-tool-editor" width="720px">
  <br>
</h1>

- Commands and Subcommands
- Parameters
- Runtime Preview
- Specify Dependencies and Validations
- JSON Output - Nested, Flat.
- Generate Help Menu
- Generate Command
- Saved Commands - using localstorage
- Exclusion Groups
- Json specification
- AI Parsing - Quickly turn help text from any CLI tool into UI.

## 📋 Todos

- ~~Implement parsing help text into json structure using AI.~~
- ~~Explore MCP server~~
- Test and Run commands from browser. Maybe using some container to securely run commands or locally using wasm.
- More tests
- Improve UI, validations.
- Shadcn Registry

## 🎯 Motivation

When there are lots of commands and options in cli tools, I often find it it confusing and I'm lazy to figure it out all by myself (or just use ChatGPT).

We also know LLMs love structured inputs, what better than a clearly defined json with listing all commands and options that go into a cli tool.

And lastly, MCPs. Goal is to expose all these tools via mcp and llms would be able to get all the details of commands and options whenever and wherever required.

## 💪🏻 Contributing

Development - Please read the [contributing guide](/CONTRIBUTING.md).

For adding new tools:

1. Create/Design tool locally
2. Copy **Flat** Json Output
3. Raise a PR, adding json file to public/tools-collection.

## 📜 License

Licensed under the [MIT license](https://github.com/divyeshio/Commandly/blob/main/LICENSE.md).
