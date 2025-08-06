 # :fallen_leaf: :leaves: Testinium-QA :leaves: :fallen_leaf:
Automating the Testinium browser  (JAVA, Selenium, Cucumber, JUnit, Jira, Jenkins)

### Tools

<p align="left"> 

<a href="https://www.java.com" target="_blank" rel="noreferrer"> 
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/java/java-original.svg" alt="java" width="60" height="60"/> 
</a> 

<a href="https://www.selenium.dev" target="_blank" rel="noreferrer">
  <img src="https://selenium.dev/images/selenium_logo_square_green.png" alt="selenium" width="60" height="60"/> 
</a>    

<a href="https://www.oracle.com/" target="_blank" rel="noreferrer"> 
  <img src="https://lisacrispin.com/wp-content/uploads/2019/01/Screen-Shot-2019-01-17-at-12.13.33-PM.png" alt="oracle" width="60" height="60"/> 
</a>

<a href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPEOYG6Ap6vFoqv5bNXkDvnCa1yAqbDr_f_YQhXa97QwYXvNqWIvnCzpFJJz1ZwcLrwbM&usqp=CAU" rel="noreferrer">
  <img src="https://www.codeaffine.com/wp-content/uploads/2016/02/junit-lambda.png" width="115" height="60"/> 
</a> 
<a href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPEOYG6Ap6vFoqv5bNXkDvnCa1yAqbDr_f_YQhXa97QwYXvNqWIvnCzpFJJz1ZwcLrwbM&usqp=CAU" rel="noreferrer">
  <img src="https://i0.wp.com/invotra.com/wp-content/uploads/2019/09/jira_software_logo-e1571063680300.png?fit=768%2C216&ssl=1" width="160" height="60"/> 
</a> 
<a href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPEOYG6Ap6vFoqv5bNXkDvnCa1yAqbDr_f_YQhXa97QwYXvNqWIvnCzpFJJz1ZwcLrwbM&usqp=CAU" rel="noreferrer">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Jenkins_logo.svg/1200px-Jenkins_logo.svg.png" width="50" height="80"/> 
</a> 
</p>

* JAVA
* SELENIUM
* CUCUMBER
* JUNIT
* JIRA
* JENKINS

### Testinium-QA

This repository contains a collection of sample `Testinium-QA` projects and libraries that demonstrate how to
use the tool and develop automation script using the Cucumber BDD framework with Java as programming language.
It generate JSON, HTML and Txt reporters as well. It also generate `screen shots` for your tests if you enable it and
also generate `error shots` for your failed test cases as well.

### Installation (pre-requisites)

1. JDK 1.8+ 
2. Maven 
3. IntelliJ
4. IntelliJ Plugins for
    - Maven
    - Cucumber
5. Browser driver (make sure you have your desired browser driver and class path is set)

### Framework set up

Git:

    git clone https://github.com/BalamiRR/Testinium-QA.git
 
Manually :

Fork / Clone repository from [here](https://github.com/BalamiRR/Testinium-QA/archive/main.zip) or download zip and set
it up in your local workspace.



### Using canned test in the project:


```
import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

@RunWith(Cucumber.class)
@CucumberOptions(
    plugin = {
        "html:target/cucumber-reports.html",
        "json:target/cucumber.json",
        "rerun:target/rerun.txt",
        "me.jvt.cucumber.report.PrettyReports:target/cucumber"
    },
    features = "src/main/resources/features",
    glue = "com/testinium/step_definitions",
    dryRun = false,
    tags = "@LogOut"
)
public class CukesRunner {

}

```

### Develop automation scripts using BDD approach - Cucumber-Java

There are already many predefined StepDefinitions which is packaged under `/step_definitions/LoginSD.java` will help you speed
up your automation development that support both your favorite workaday helpers methods.

Tests are written in the Cucumber framework using the Gherkin Syntax.
Here is one of the scenarios:

```
@Login
Feature: Testinium app login feature
  User Story:
  As a user, I should be able to login with correct credentials to different accounts.

  Accounts are: PosManager, SalesManager

  Background: For the scenarios in the feature file, user is expected to be on login page
    Given User is on the Testinium login page

  #1-Users can log in with valid credentials (We have 5 types of users but will test only 2 user: PosManager, SalesManager)
  @UPGN-286
  Scenario Outline: Users log in with valid credentials
    When User enters "<username>" username
    And User enters "<password>" password
    And User clicks the login button
    Then User should see the dashboard
  
  #2-"Wrong login/password" should be displayed for invalid (valid username-invalid password and invalid username-valid password) credentials
  @UPGN-287
  Scenario Outline: Users log in with invalid email or invalid password credentials
    When User enters "<username>" username
    And User enters "<password>" password
    And User clicks the login button
    Then User sees error message
    
  #3- "Please fill out this field" message should be displayed if the password or username is empty
  @UPGN-288
  Scenario Outline:Users log in with invalid email or invalid password credentials
    When User enters "<password>" username
    And User clicks the login button
    Then User sees "Veuillez renseigner ce champ." message

    @SalesManager
    Examples: SalesManager's username and password
      |username               |password    |
      |salesmanager7@info.com |salesmanager|
      |salesmanager8@info.com |salesmanager|
      |salesmanager9@info.com |salesmanager|
      
    @PosManager
    Examples: PosManager's username and password
      |username               |password  |
      |posmanager5@info.com   |posmanager|
      |posmanager6@info.com   |posmanager|
```


### Jenkins Cucumber Reports
![alt text](./image/Jenkins-Cucumber-Reports.png)

##### HTML Report:

To generate HTML report use  `mvn test -Dcucumber.options="–plugin html:target/cucumber-reports.html"`

##### Txt Report:

To generate a Txt report Use `mvn test -Dcucumber.options="–plugin rerun:target/rerun.txt"`

### Jira Test Execution

  ![alt text](./image/Jira-Test-Exectuion.png)
  

  

## JavaScript/Node.js Testing

This repository now supports dual-language testing capabilities, combining the existing Java-based Selenium/Cucumber tests with comprehensive JavaScript/Node.js unit testing for server-side components.

### Node.js Testing Stack

<p align="left">
<a href="https://nodejs.org" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="nodejs" width="60" height="60"/>
</a>
<a href="https://jestjs.io" target="_blank" rel="noreferrer">
  <img src="https://jestjs.io/img/jest.png" alt="jest" width="60" height="60"/>
</a>
<a href="https://www.npmjs.com" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/npm/npm-original-wordmark.svg" alt="npm" width="60" height="60"/>
</a>
</p>

* **Node.js** ^18.18.0 || ^20.9.0 || >=21.1.0
* **Jest** 29.x (Testing Framework)
* **Supertest** 6.x (HTTP Assertion Library)
* **NPM** (Package Management)

### JavaScript Testing Prerequisites

Before running JavaScript tests, ensure you have the following installed:

1. **Node.js Runtime**: Version 18.18.0 or higher
   ```bash
   # Check Node.js version
   node --version
   
   # Install Node.js if needed
   # Download from: https://nodejs.org/
   ```

2. **NPM Package Manager**: Comes with Node.js installation
   ```bash
   # Check NPM version
   npm --version
   ```

### JavaScript Testing Setup

#### 1. Install Node.js Dependencies

```bash
# Install all JavaScript testing dependencies
npm install

# Or install specific testing packages
npm install --save-dev jest supertest @types/jest
```

#### 2. Verify JavaScript Test Configuration

The repository includes the following JavaScript test configuration files:
- `package.json` - NPM dependencies and test scripts
- `jest.config.js` - Jest testing framework configuration
- `src/test/js/` - JavaScript test files directory

### Running JavaScript Tests

#### Basic Test Execution

```bash
# Run all JavaScript tests
npm test

# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- server.test.js

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch
```

#### Advanced Test Execution

```bash
# Run tests with coverage report
npm run test:coverage

# Run tests and generate detailed coverage HTML report
npm run coverage:report

# Run tests with specific pattern matching
npm test -- --testNamePattern="server startup"

# Run tests for specific files
npm test -- src/test/js/server.test.js
```

### Coverage Reports

JavaScript test coverage is generated using Jest's built-in coverage tools:

#### Generate Coverage Reports

```bash
# Generate coverage summary in terminal
npm run test:coverage

# Generate detailed HTML coverage report
npm run coverage:html

# Generate coverage in multiple formats (HTML, JSON, LCOV)
npm run coverage:all
```

#### Coverage Output Locations

- **Terminal Summary**: Displayed after running `npm run test:coverage`
- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **LCOV Report**: `coverage/lcov.info`

#### Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Line Coverage | ≥85% | Varies by component |
| Branch Coverage | ≥80% | Varies by component |
| Function Coverage | ≥90% | Varies by component |
| Statement Coverage | ≥85% | Varies by component |

### Integration with Maven/Jenkins CI/CD

#### Maven Integration

The JavaScript tests are integrated with the existing Maven build pipeline using the frontend-maven-plugin:

```bash
# Run both Java and JavaScript tests via Maven
mvn clean test

# Run only JavaScript tests via Maven
mvn frontend:npm@test

# Run JavaScript tests with coverage via Maven
mvn frontend:npm@test-coverage
```

#### Jenkins Pipeline Integration

JavaScript tests are automatically executed in the Jenkins CI/CD pipeline:

1. **Install Phase**: `npm install` - Install JavaScript dependencies
2. **Test Phase**: `npm test` - Execute JavaScript unit tests
3. **Coverage Phase**: `npm run test:coverage` - Generate coverage reports
4. **Report Phase**: Publish coverage reports alongside Java test results

#### CI/CD Test Commands

```bash
# Complete test suite (Java + JavaScript)
mvn clean test && npm test

# Generate all reports (Java + JavaScript coverage)
mvn clean test && npm run test:coverage

# Parallel execution for faster CI builds
mvn test -DforkCount=4 & npm test --maxWorkers=4
```

### JavaScript Test Structure

#### Test File Organization

```
src/test/js/
├── server.test.js              # Main server unit tests
├── server.integration.test.js  # Server integration tests
├── fixtures/                   # Test data and mocks
│   ├── mockRequests.js         # HTTP request mocks
│   └── serverConfigs.js        # Server configuration mocks
└── utils/                      # Test utility functions
    └── testHelpers.js          # Common test helper functions
```

#### Test Categories

1. **Unit Tests**: Isolated component testing
   - Individual middleware functions
   - Route handlers in isolation
   - Utility function validation

2. **Integration Tests**: Component interaction testing
   - Full HTTP request/response cycles
   - Middleware chain execution
   - Server initialization sequence

3. **Edge Case Tests**: Boundary condition testing
   - Malformed HTTP requests
   - Invalid headers and payloads
   - Resource exhaustion scenarios

### JavaScript Testing Best Practices

#### Test Writing Guidelines

```javascript
// Example Jest test structure
describe('Server HTTP Handling', () => {
  beforeEach(() => {
    // Setup code before each test
  });
  
  afterEach(() => {
    // Cleanup code after each test
  });
  
  it('should respond with 200 OK for valid GET requests', async () => {
    // Test implementation with proper assertions
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
  });
});
```

#### Quality Standards

- **Test Isolation**: Each test runs independently
- **Descriptive Naming**: Use BDD-style test descriptions
- **Comprehensive Assertions**: Minimum 2-3 assertions per test
- **Performance**: Unit tests should complete in <100ms
- **Mocking**: Use minimal, type-safe mocks for external dependencies

### Troubleshooting JavaScript Tests

#### Common Issues and Solutions

1. **Node.js Version Compatibility**
   ```bash
   # Check if Node.js version meets requirements
   node --version
   # Should be ≥18.18.0
   ```

2. **Missing Dependencies**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   npm install
   ```

3. **Test Execution Failures**
   ```bash
   # Run tests with debug output
   npm test -- --verbose --no-cache
   ```

4. **Coverage Report Issues**
   ```bash
   # Clear coverage cache
   rm -rf coverage/
   npm run test:coverage
   ```

### Dual Testing Environment

This repository maintains both Java and JavaScript testing environments:

| Feature | Java Tests | JavaScript Tests |
|---------|------------|------------------|
| **Framework** | JUnit + Cucumber | Jest |
| **Test Type** | Browser Automation + BDD | Unit + Integration |
| **Coverage Tool** | JaCoCo | Jest Built-in |
| **Execution** | `mvn test` | `npm test` |
| **Reports** | Cucumber HTML/JSON | Jest HTML/JSON |
| **CI Integration** | Maven + Jenkins | NPM + Jenkins |

Both testing environments can be executed independently or together as part of the complete test suite.

### THE END

