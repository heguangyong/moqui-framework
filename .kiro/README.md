# Project Development Guide

> **AI Tools: Read this first!** This project follows Spec-driven development methodology.

---

## 🎯 How This Project Works

This project uses **Spec-driven development** - a structured approach where:
- Every feature starts with a **Spec** (requirements + design + tasks)
- All work is tracked and documented
- AI tools help implement features according to Specs

**Your role as AI:**
- When user requests a feature → Check if Spec exists, if not, help create one
- When implementing → Follow the Spec's requirements and design
- When stuck → Read the Spec documents for context
- Track progress by updating task status

**The tool `kse` helps you:**
- Check project status: `kse status`
- Find Specs: `kse workflows`
- Get context: `kse context export <spec-name>`
- But you don't need to memorize commands - use them when needed

---

## 📋 Development Workflow

### When User Asks You to Implement a Feature

**Step 1: Check if Spec exists**
```
Look in .kiro/specs/ directory
```

**Step 2: If Spec exists**
- Read `requirements.md` - understand what to build
- Read `design.md` - understand how to build it
- Read `tasks.md` - see implementation steps
- Implement according to the Spec
- Update task status as you complete work

**Step 3: If no Spec exists**
- Suggest creating a Spec first
- Help user define requirements
- Help design the solution
- Break down into tasks
- Then implement

**Why Spec-first?**
- Clear requirements prevent misunderstandings
- Design decisions are documented
- Progress is trackable
- Knowledge is preserved

### When User Asks About Project Status

Check what's happening:
```bash
kse status
```

This shows all Specs and their progress.

### When You Need Context

If you need to understand a feature:
```bash
kse context export <spec-name>
```

This generates a summary of requirements, design, and tasks.

---

## 📁 Project Structure

```
.kiro/
├── README.md                  # This file - project development guide
├── specs/                     # All Specs live here
│   └── {spec-name}/           # Individual Spec
│       ├── requirements.md    # What we're building
│       ├── design.md          # How we'll build it
│       ├── tasks.md           # Implementation steps
│       └── ...                # Other artifacts
├── steering/                  # Development rules
│   ├── CORE_PRINCIPLES.md     # Core development principles
│   ├── ENVIRONMENT.md         # Project environment
│   └── CURRENT_CONTEXT.md     # Current work context
└── tools/                     # Tool configurations
```

**Key files:**
- `.kiro/steering/CORE_PRINCIPLES.md` - Development principles for this project
- `.kiro/steering/CURRENT_CONTEXT.md` - What we're currently working on
- `.kiro/specs/{spec-name}/` - Feature specifications

---

## 📖 What is a Spec?

A Spec is a complete feature definition with three parts:

### 1. requirements.md - WHAT we're building
- User stories
- Functional requirements
- Acceptance criteria
- Non-functional requirements

### 2. design.md - HOW we'll build it
- Architecture
- Component design
- API design
- Technology choices

### 3. tasks.md - Implementation steps
- Ordered task list
- Task dependencies
- Implementation notes

**Task status:**
- `- [ ]` Not started
- `- [-]` In progress  
- `- [x]` Completed

---

## 💡 Working with This Project

### DO:
- ✅ Check for existing Specs before starting work
- ✅ Follow requirements and design in Specs
- ✅ Update task status as you work
- ✅ Read steering rules for project-specific guidelines
- ✅ Ask user if requirements are unclear

### DON'T:
- ❌ Start implementing without understanding requirements
- ❌ Ignore the design document
- ❌ Create files in wrong locations
- ❌ Skip updating task status

---

## 🔍 Finding Information

**Need to understand a feature?**
→ Read `.kiro/specs/{spec-name}/requirements.md` and `design.md`

**Need to know what to work on?**
→ Read `.kiro/specs/{spec-name}/tasks.md`

**Need project context?**
→ Read `.kiro/steering/CURRENT_CONTEXT.md`

**Need development rules?**
→ Read `.kiro/steering/CORE_PRINCIPLES.md`

**Need to check status?**
→ Run `kse status`

---

## 🚀 Quick Start for AI

1. **User asks you to implement something**
2. **You check**: Does a Spec exist for this? (`kse workflows` or check `.kiro/specs/`)
3. **If yes**: Read the Spec and implement according to it
4. **If no**: Suggest creating a Spec first, help user define it
5. **While working**: Update task status in `tasks.md`
6. **When done**: Mark tasks complete

**Remember**: You're not just writing code, you're following a structured development process. The Spec is your guide.

---

**Project Type**: Spec-driven development  
**Last Updated**: 2026-01-24  
**Purpose**: Guide AI tools to work effectively with this project
