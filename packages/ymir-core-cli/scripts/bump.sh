#!/bin/zsh

if [ -z "$1" ]; then
  echo "Error: Need to add tag massage as first arg." >&2
  exit 1
fi

require_clean_work_tree() {
    # Update the index
    git update-index -q --ignore-submodules --refresh
    err=0

    # Disallow unstaged changes in the working tree
    if ! git diff-files --quiet --ignore-submodules --
    then
        echo >&2 "cannot $1: you have unstaged changes."
        git diff-files --name-status -r --ignore-submodules -- >&2
        err=1
    fi

    # Disallow uncommitted changes in the index
    if ! git diff-index --cached --quiet HEAD --ignore-submodules --
    then
        echo >&2 "cannot $1: your index contains uncommitted changes."
        git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2
        err=1
    fi

    if [ $err = 1 ]
    then
        echo >&2 "Please commit or stash them."
        exit 1
    fi
}

require_clean_work_tree

mydir=${0:a:h}

bump=$(npm version patch)

name=$(echo "$bump" | head -n 1)
name=${name#@onevor/}
version=$(echo "$bump" | head -n 2 | tail -n 1)
tagName=${name}/${version}

git add ${mydir}/../package.json
git add ${mydir}/../package-lock.json
git add ${mydir}/../../../package-lock.json

git commit -m "chore: bump version ${tagName}"
git tag -a ${tagName} -m $1


