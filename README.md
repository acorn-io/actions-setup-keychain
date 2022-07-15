# actions-setup-keychain

<p align="left">
  <a href="https://github.com/acorn-io/actions-setup-keychain"><img alt="GitHub Actions status" src="https://github.com/acorn-io/actions-setup-keychain/workflows/Main%20workflow/badge.svg"></a>
</p>

GitHub action to create a macOS keychain if it doesn't already exist and make it the default during the workflow run.

# Usage

```yaml
steps:
- uses: actions/checkout@master
- uses: acorn-io/actions-setup-keychain@v1.0
- run:  ...your workflow...
```

See [action.yml](action.yml) for all options.


# License

Copyright (c) 2022 Acorn Labs, Inc.
[Copyright Jaehong Kang](https://github.com/sinoru/actions-setup-keychain)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
