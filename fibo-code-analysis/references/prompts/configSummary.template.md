# {config file name}

<tag value="code" />
(Generate a code-block tag for the entire config file, with href pointing to the file path, the tag text showing the full relative path of the file, using the ?class=code parameter)

## Config file overview

#### File role
(State the config file's core role and scope of impact in the project)
(Describe the config file's purpose, load timing, scope, etc.)

{overall description of the config file's role, including purpose, scope of impact, load method, etc.}

#### Config file type
(Identify the format type of the config file)

{config file type description, e.g. JSON config file, YAML config file, environment-variable file, etc.}

## Config-item breakdown

(List all config items in logical groups, each group containing related config items)
(Each config item should include: name, location, type, current value, role description, allowed values, etc.)
(Use code-block tags to locate the specific code lines of each important config item)

{detailed list of config items, organized by group}

### {config group name}
(e.g. server config, database config, application config, etc.)

#### `{config item name}`

<tag value="code" />
(Generate a code-block tag for this config item, with href pointing to the specific line-number range, the tag text showing the full relative path of the file and the line numbers, using the ?class=code parameter)

- **Data type**: {the data type of the config item}
- **Current value**: `{the current value in the config file}`
- **Config description**: {the role and impact of this config item}
- **Allowed values**: {the possible value range or recommended values}
- [**Dependent config**: {other config items related to this one}]
- [**Environment differences**: {recommended values for this config item across different environments}]

(Repeat the structure above, listing all config items, organized by group)

## Usage scenarios

(State how the config file is used in different scenarios)

#### Development environment
{config recommendations and cautions for the development environment}

[#### Test environment
{config recommendations and cautions for the test environment}]

[#### Production environment
{config recommendations and cautions for the production environment}]

## Config recommendations

(Provide best practices and recommendations for using the config file)

[#### Security recommendations
{recommendations on protecting sensitive information, key management, etc.}]

[#### Performance optimization
{optimization recommendations for performance-related config items}]

[#### Common issues
{common issues and solutions when using this config file}]

#### Important notes
{key config cautions and warning information}

---
name: {config file name} config summary

update-time: {YYYY-MM-DD HH:mm}

description: {one-sentence description of this config file's purpose, config scope, and cautions, for easy retrieval}

---

----------
