import os
import sys
import subprocess

base_dir = os.path.dirname(os.path.abspath(__file__))
git_exe = os.path.join(base_dir, "tools", "mingit", "cmd", "git.exe")

if not os.path.exists(git_exe):
    # Try system git if available
    git_exe = "git"

print("Using Git executable:", git_exe)

def run_git(args):
    cmd = [git_exe] + args
    print(f"Running: {' '.join(cmd)}")
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    res = subprocess.run(cmd, cwd=base_dir, capture_output=True, text=True, encoding="utf-8", errors="ignore", env=env)
    print("STDOUT:", res.stdout.strip())
    if res.stderr.strip():
        print("STDERR:", res.stderr.strip())
    return res.returncode

# 1. git init
run_git(["init"])

# 2. config identity if not set
run_git(["config", "user.name", "emudracsc"])
run_git(["config", "user.email", "emudracsc@users.noreply.github.com"])

# 3. branch -M main
run_git(["branch", "-M", "main"])

# 4. git add
run_git(["add", "."])

# 5. git commit
run_git(["commit", "-m", "Initial release: Marathi & English PDF Text Replacer with HarfBuzz Shaping & PDF Merger PRO"])

# 6. git remote
run_git(["remote", "remove", "origin"])
run_git(["remote", "add", "origin", "https://github.com/emudracsc/index.git"])

# 7. git push
print("\n--- Pushing to https://github.com/emudracsc/index.git ---")
code = run_git(["push", "-u", "origin", "main", "--force"])

if code == 0:
    print("\n✅ Successfully pushed to https://github.com/emudracsc/index.git!")
else:
    print("\n⚠️ Push command exited with code:", code)
