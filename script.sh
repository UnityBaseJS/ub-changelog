#!/usr/bin/env bash

# this script refresh all CHANGELOG.md files at some repository 
# adding dates of versions' releases near this versions 
# keep a changelog https://keepachangelog.com/en/1.1.0/

refreshLogs() {
    git blame $1 | while read line 
    do
        [[ $line =~ \[[0-9.a-z-]*\]$ ]] &&
        commit=`echo $line | awk '{print $1;}'` &&
        commit_date=`git show -s --format=%cd --date=short "$commit"` &&
        version_string=`echo $line | awk 'NF > 1{print $NF}'` &&
        line_with_date="## ${version_string} - ${commit_date}" &&
        version_string=${version_string/\[/\\[} &&
        version_string=${version_string/\]/\\]} &&
        version_string=${version_string//./\\.} &&
        sed -i "s/^.*$version_string.*$/$line_with_date/g" $1
    done
}

repository="ubjs"
rm -rf ./$repository &&
git clone https://git-pub.intecracy.com/unitybase/$repository.git &&
cd $repository &&
find $(pwd)/ -type f -path \*/CHANGELOG.md | sort | uniq | while read path 
do
    echo -e " \033[0;36m$path\033[0m"
    refreshLogs $path
done
git checkout -b update-changelogs &&
git add . &&
git commit -m "add dates of versions' releases at changelogs" &&
echo -e "\n \033[1;36mGit status\033[1;33m" &&
git status &&
git push --set-upstream origin update-changelogs
