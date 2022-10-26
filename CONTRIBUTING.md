# Contributing

This chapter describes the guidelines for contributing to the repository.

## Branches

- **master**: it's the main branch. It has the recent project version that works correctly.
- **<new_branch>**: we have to create a new branch for each issue that we will develop. This branch will be removed after merge it in master. The name of the branch should be in the format *issue_xyz*, *feature_xyz* or similar- 

***NOTE: We can never push a commit directly to master, we have to create a PR to add changes in master** 

## Create a new Feature or solve a Bug

If there is a bug in the server or a new fetaure that we have to implement, we have to follow the next steps:

### 1. :beetle: Create new Issue

Create a new issue in "Issues" section and tag it as a "bug" or "enhancement"

### 2. :octocat: Create a new Branch

Create a new branch where you can implement this new feature and make the changes.

### 3. :new: Create a PR to master

Once your new feature is implemented and you tested that it works correctly, you must create a Pull Request to merge it to master. Before mergeing, this PR will be reviewed and approved (or rejected) by one of the repository owners (@hector23rp or @adominguez) in order to check that it works correctly and there are no integration issues.

### 4. Merge PR

Once one of the owners has approved the PR, you can then merge the PR in master. If it is required, notify this changes to the rest of team.
