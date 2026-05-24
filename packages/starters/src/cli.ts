import { Command } from "commander";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";

const program = new Command();
program.name("aph-starters").description("AI Provider Harness starter components").version("0.1.0");

program
  .command("add <template> [dest]")
  .description("copy a template into your project")
  .option("-f, --force", "overwrite existing files")
  .action(async (template: string, dest: string | undefined, opts: { force?: boolean }) => {
    await addCommand(template, dest ?? "./components/aph", opts);
  });

program.command("list").description("list available templates").action(listCommand);

program.parseAsync().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
