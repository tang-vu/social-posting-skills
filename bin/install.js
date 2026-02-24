#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const REPO = "https://github.com/tang-vu/social-posting-skills.git";
const HOME = process.env.HOME || process.env.USERPROFILE || "";

function resolveDir(p) {
    if (!p) return null;
    const s = p.replace(/^~($|\/)/, HOME + "$1");
    return path.resolve(s);
}

function parseArgs() {
    const a = process.argv.slice(2);
    let pathArg = null;
    let cursor = false,
        claude = false,
        gemini = false,
        antigravity = false;

    for (let i = 0; i < a.length; i++) {
        if (a[i] === "--help" || a[i] === "-h") return { help: true };
        if (a[i] === "--path" && a[i + 1]) {
            pathArg = a[++i];
            continue;
        }
        if (a[i] === "--cursor") { cursor = true; continue; }
        if (a[i] === "--claude") { claude = true; continue; }
        if (a[i] === "--gemini") { gemini = true; continue; }
        if (a[i] === "--antigravity") { antigravity = true; continue; }
        if (a[i] === "--project") { pathArg = "./.agents"; continue; }
        if (a[i] === "install") continue;
    }

    return { pathArg, cursor, claude, gemini, antigravity };
}

function defaultDir(opts) {
    if (opts.pathArg) return resolveDir(opts.pathArg);
    if (opts.cursor) return path.join(HOME, ".cursor", "skills");
    if (opts.claude) return path.join(HOME, ".claude", "skills");
    if (opts.gemini) return path.join(HOME, ".gemini", "skills");
    if (opts.antigravity)
        return path.join(HOME, ".gemini", "antigravity", "skills");
    // Default: install into current project's .agents directory
    return path.resolve(".agents");
}

function printHelp() {
    console.log(`
social-posting-skills -- installer

  npx social-posting-skills [options]

  Installs social media posting skills into your AI agent's skills directory.

Options:
  --project      Install to ./.agents/ in current directory (default)
  --cursor       Install to ~/.cursor/skills/
  --claude       Install to ~/.claude/skills/
  --gemini       Install to ~/.gemini/skills/
  --antigravity  Install to ~/.gemini/antigravity/skills/
  --path <dir>   Install to custom directory
  -h, --help     Show this help

Examples:
  npx social-posting-skills                    # Install to ./.agents/
  npx social-posting-skills --antigravity      # Install globally for Antigravity
  npx social-posting-skills --cursor           # Install for Cursor IDE
  npx social-posting-skills --path ./my-skills # Install to custom path
`);
}

function copyRecursiveSync(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((child) => {
            if (child === ".git") return;
            copyRecursiveSync(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function run(cmd, args) {
    const r = spawnSync(cmd, args, { stdio: "inherit" });
    if (r.status !== 0) process.exit(r.status == null ? 1 : r.status);
}

function main() {
    const opts = parseArgs();

    if (opts.help) {
        printHelp();
        return;
    }

    const target = defaultDir(opts);
    if (!target) {
        console.error("Could not resolve target directory. Use --path <dir>.");
        process.exit(1);
    }

    console.log("\n📢 Social Posting Skills Installer\n");
    console.log(`Target: ${target}\n`);

    // Clone to temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "social-posting-"));

    try {
        console.log("Cloning repository...");
        if (process.platform === "win32") {
            run("git", ["-c", "core.symlinks=true", "clone", "--depth", "1", REPO, tempDir]);
        } else {
            run("git", ["clone", "--depth", "1", REPO, tempDir]);
        }

        // Determine source paths
        const repoSkills = path.join(tempDir, ".agents", "skills");
        const repoWorkflows = path.join(tempDir, ".agents", "workflows");

        if (!fs.existsSync(repoSkills)) {
            console.error("Error: Cloned repo missing .agents/skills/ directory.");
            process.exit(1);
        }

        // Create target directories
        const skillsTarget = opts.pathArg || opts.cursor || opts.claude || opts.gemini || opts.antigravity
            ? target  // Global: copy skills directly into target
            : path.join(target, "skills");  // Project: .agents/skills/
        const workflowsTarget = opts.pathArg || opts.cursor || opts.claude || opts.gemini || opts.antigravity
            ? null  // Global installs skip workflows
            : path.join(target, "workflows");  // Project: .agents/workflows/

        // Install skills
        console.log(`\nInstalling skills to ${skillsTarget}...`);
        if (!fs.existsSync(skillsTarget)) {
            fs.mkdirSync(skillsTarget, { recursive: true });
        }
        fs.readdirSync(repoSkills).forEach((name) => {
            const src = path.join(repoSkills, name);
            const dest = path.join(skillsTarget, name);
            copyRecursiveSync(src, dest);
        });

        // Install workflows (project mode only)
        if (workflowsTarget && fs.existsSync(repoWorkflows)) {
            console.log(`Installing workflows to ${workflowsTarget}...`);
            if (!fs.existsSync(workflowsTarget)) {
                fs.mkdirSync(workflowsTarget, { recursive: true });
            }
            fs.readdirSync(repoWorkflows).forEach((name) => {
                const src = path.join(repoWorkflows, name);
                const dest = path.join(workflowsTarget, name);
                copyRecursiveSync(src, dest);
            });
        }

        // Also copy posts directory for project mode
        if (!opts.pathArg && !opts.cursor && !opts.claude && !opts.gemini && !opts.antigravity) {
            const repoPosts = path.join(tempDir, "posts");
            const postsTarget = path.resolve("posts");
            if (fs.existsSync(repoPosts) && !fs.existsSync(postsTarget)) {
                console.log(`Creating posts directory...`);
                copyRecursiveSync(repoPosts, postsTarget);
            }
        }

        // Count installed skills
        const skillCount = fs.readdirSync(skillsTarget).filter((name) => {
            return fs.statSync(path.join(skillsTarget, name)).isDirectory();
        }).length;

        console.log(`\n✅ Installed ${skillCount} skills successfully!`);
        console.log(`\nUsage:`);
        console.log(`  Tell your AI agent: "Post about [topic] to all platforms"`);
        console.log(`  Or use the workflow:  /post-social`);
        console.log(`\nDocs: https://github.com/tang-vu/social-posting-skills`);

    } finally {
        // Cleanup temp directory
        try {
            if (fs.existsSync(tempDir)) {
                if (fs.rmSync) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                } else {
                    fs.rmdirSync(tempDir, { recursive: true });
                }
            }
        } catch (e) {
            // ignore cleanup errors
        }
    }
}

main();
