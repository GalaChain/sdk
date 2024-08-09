#!/bin/bash

#
# Copyright (c) Gala Games Inc. All rights reserved.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Specify the copyright header pattern
copyright_pattern="Copyright (c|\(c\)) Gala Games Inc"

# Find all files that need copyright in the current repository
# respecting .gitignore and ignoring any ethers folder
files=$(git ls-files | grep -E '\.js$|\.ts$|\.sh$' | grep -v '/ethers/')

# Array to store files missing the copyright header
missing_copyright_files=()

# Loop through each file and check for the copyright header
for file in $files; do
    if ! grep -q -E "$copyright_pattern" "$file"; then
        missing_copyright_files+=("$file")
    fi
done

# Print the list of files missing the copyright header
if [ ${#missing_copyright_files[@]} -eq 0 ]; then
    echo "All files have the copyright header."
else
    if [ ${#missing_copyright_files[@]} -eq 1 ]; then
        echo "File is missing the copyright header:"
    else
        echo "${#missing_copyright_files[@]} files are missing the copyright header:"
    fi
    for missing_file in "${missing_copyright_files[@]}"; do
        echo "$missing_file"
    done
    echo "
Please add the following notice at the top of the files listed above:

/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the \"License\");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an \"AS IS\" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */"
    exit 1
fi
