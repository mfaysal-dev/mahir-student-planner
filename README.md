# Mahir's Student Planner

A modern student task manager that runs entirely in the browser. Plan study sessions, homework, and projects with deadlines, priorities, search, and filters. Tasks and the theme preference are stored with `localStorage`, so a refresh keeps your work. There is no database, no build step, and no AI API.

## Features

- Dashboard with a welcome message, today's date, a live clock, and counts for total, completed, pending, and due-today tasks
- Progress bar for completed work
- Add, edit, delete, and complete tasks
- Deadlines and priorities: Low, Medium, and High
- Categories: Study, Homework, Personal, Projects, and Other
- Search, status filter, priority filter, category filter, and deadline sorting
- Dark and light themes, with the choice saved in the browser
- Empty state, delete confirmation, and toast notifications
- Responsive layout for desktop, tablet, and phone

## Tech

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage

No frameworks, no paid libraries, and no remote APIs.

## Project structure

```text
student-task-manager/
├── index.html
├── style.css
├── script.js
├── favicon.svg
├── README.md
├── .gitignore
└── .nojekyll
```

`.nojekyll` tells GitHub Pages to publish the files as they are.

## Run it locally

No installation is required.

1. Clone or download this folder.
2. Open `index.html` in Chrome or Edge.

Or start a small local server from the project folder:

```powershell
cd C:\Users\mahir\source\repos\student-task-manager
python -m http.server 5500
```

Then open [http://localhost:5500](http://localhost:5500).

Tasks stay in that browser profile. Clearing site data removes them.

## Upload to GitHub

Repository: `mfaysal-dev/mahir-student-planner`

From the project folder:

```powershell
git add index.html style.css script.js favicon.svg README.md .gitignore .nojekyll
git commit -m "Add Mahir's Student Planner"
git branch -M main
git remote add origin https://github.com/mfaysal-dev/mahir-student-planner.git
git push -u origin main
```

Create the empty public repository on GitHub first if it does not exist yet: [github.com/new](https://github.com/new), name it `mahir-student-planner`, and do not add a generated README so this one is the first commit.

## GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`.
5. Save.

The live site will be:

[https://mfaysal-dev.github.io/mahir-student-planner/](https://mfaysal-dev.github.io/mahir-student-planner/)

The first publish can take a minute. The repository needs to be public for GitHub Pages on a free account.
