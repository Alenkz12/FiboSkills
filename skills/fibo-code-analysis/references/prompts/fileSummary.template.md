# {file name}

<tag value="code" />
(Generate a code-block tag for the entire file, with href pointing to the file path, the tag text showing the full relative path of the file, using the ?class=code parameter)

## Global overview

#### Core functionality
(List the main functional features the file provides)
(Describe the roles of the key classes, functions, and interfaces)
(State the core problem the file solves, highlighting its core value and business significance)

{detailed functionality introduction, including main features and capabilities}

#### Code logic
(Algorithm approach: analyze the design approach and implementation strategy of the core algorithm)
(Data flow: describe how data flows between functions)
(Key steps: identify the key steps and decision points in code execution)
(Implementation principles: explain the implementation mechanism and technical details of the core functionality)
(Design patterns: identify the design patterns used, such as singleton, factory, observer, etc.)
(Architecture layers: state the code's organizational structure and modularization strategy)

{introduce the implementation principles of the core code logic, including algorithm approach, data flow, key steps, etc.}

#### Code concept graph
(Generate a Mermaid flowchart; it must include the full HTML structure and the node-info JSON comment; the tag text shows the full relative path of the file and a sequence number; the href uses the ?class=graph parameter)
(Graph generation rules:)
(1. Single-function file: generate one flowchart showing the internal execution flow and logic branches of the function)
(2. Multi-function file: create an independent subgraph for each function, showing each function's internal flow, and connect inter-function call relationships with dashed lines -.->)
(3. No-function file: such as a class definition or config file, draw a classDiagram or component-relationship graph to show structure and relationships)

<tag value="graph" />

#### Expert view

(This section distills insight from an expert perspective. State it objectively; unfounded subjective empty words are forbidden — words like "excellent", "clever", "friendly", "reasonable", "clear" must not appear on their own and must land on concrete code facts.)
(The "key points" below is the mandatory floor section; the other evaluative subsections are all optional and follow the "write only when grounded" principle: include a section only when it can point to concrete code evidence, otherwise omit the whole section including its heading; fabrication to pad content is forbidden.)

##### Key points
{distill the 1-3 most core, most noteworthy technical points or business value, based on this file's actual code, stated objectively one by one}

[##### Design highlights
(Write this only when there are identifiable concrete design patterns / implementation techniques in the file, and annotate the corresponding code line range as evidence; if none can be determined, omit this section)
{explain design techniques one by one, each with line-number evidence, e.g. "uses the factory pattern to centralize object creation (see lines 45-67)"}]

[##### Potential risks
(Write this only when there are identifiable concrete risk points, and annotate the corresponding code line range as evidence; without clear evidence omit this section, and vague talk or speculation is forbidden)
{explain performance bottlenecks / security hazards / maintenance difficulties / technical debt one by one, each with line-number evidence}]

[##### Improvement suggestions
(Write this only when a corresponding issue has been listed under "Potential risks" above, and each suggestion must correspond to a listed risk; if no risk is listed, omit this section, and empty refactoring talk detached from the current state is forbidden)
{give actionable optimization / refactoring suggestions one by one, each corresponding to a listed risk}]

---
name: {file name} file summary

update-time: {YYYY-MM-DD HH:mm}

description: {one-sentence description of this file's core responsibility, main structure, and analysis scope, for easy retrieval}

---

----------

