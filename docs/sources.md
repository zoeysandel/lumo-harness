# Sources

Lumo Harness Slice 1 follows the official OpenAI Agents SDK shape:

- Agents are created with a `name` and `instructions`.
- Runs use `run(agent, input)`.
- Function tools use `tool({ name, description, parameters, execute })` with Zod parameters.

References:

- https://openai.github.io/openai-agents-js/guides/quickstart/
- https://openai.github.io/openai-agents-js/guides/tools/
- https://developers.openai.com/tracks/building-agents/

