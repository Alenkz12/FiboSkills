# {directory name}

## Global overview

### Key role
(Analyze the directory's strategic position and core value in the overall project)
(Identify the main responsibilities and business domains the directory bears)
(State the directory's collaboration relationships with other modules, highlighting its unique contribution and importance)

{detailed description of the directory's core role and its position in the project}

#### Code architecture
(Interaction patterns: analyze the call relationships and data passing between files)
(Dependency structure: identify the dependency relationships and hierarchy between files)
(Data flow: describe how data flows between different files)
(Collaboration mechanism: state how files work together to accomplish business goals)
(Architecture pattern: identify the architecture pattern the directory adopts, such as MVC, layered, etc.)

{detailed analysis of how the code files interact, including data flow, call relationships, dependency structure, etc.}

#### Architecture concept graph
(Generate a directory-level Mermaid architecture graph showing the relationships of files and subdirectories; the tag text shows the full relative path of the directory and a sequence number; the href uses the ?class=graph parameter)
(You must extract precise line-number information from the info.md content in the input items and fill it into the nodes' position fields)
(Fill each node's path field with the relative path of the corresponding file or subdirectory)
(Common graph types: component-relationship graph, layered-architecture flowchart, module-interaction graph, etc.)

<tag value="graph" />

#### Expert view

(This section distills insight at the architecture level. State it objectively; unfounded subjective empty words are forbidden — words like "excellent", "clever", "friendly", "reasonable", "clear" must not appear on their own and must land on concrete file / subdirectory / dependency facts.)
(The "core value" below is the mandatory floor section; the other evaluative subsections are all optional and follow the "write only when grounded" principle: include a section only when it can point to a concrete child item / path / dependency relationship as evidence, otherwise omit the whole section including its heading; fabrication to pad content is forbidden.)

##### Core value
{distill 1-3 items of the directory's core value / strategic position / business significance in the project, based on the actual child items in the directory, stated objectively one by one}

[##### Architecture strengths
(Write this only when there are identifiable concrete organization techniques / responsibility divisions, and indicate the corresponding child item or path as evidence; if none can be determined, omit this section)
{explain architecture-organization techniques one by one, each with child-item / path evidence, e.g. "controllers and services are layered (controllers/ separated from services/)"}]

[##### Potential issues
(Write this only when there are identifiable concrete architecture problems, and indicate the corresponding child item / dependency relationship as evidence; without clear evidence omit this section, and vague talk or speculation is forbidden)
{explain architecture flaws / module coupling / responsibility overlap / scalability bottlenecks one by one, each with evidence}]

[##### Optimization directions
(Write this only when a corresponding issue has been listed under "Potential issues" above, and each suggestion must correspond to a listed issue; if no issue is listed, omit this section, and empty refactoring talk detached from the current state is forbidden)
{give actionable refactoring / splitting / dependency-optimization suggestions one by one, each corresponding to a listed issue}]

---
name: {directory name} directory summary

update-time: {YYYY-MM-DD HH:mm}

description: {one-sentence description of this directory's core responsibility, architecture relationships, and analysis scope, for easy retrieval}

---


