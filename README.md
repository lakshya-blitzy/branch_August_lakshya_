 # :fallen_leaf: :leaves: Testinium-QA :leaves: :fallen_leaf:
Dual-Stack Test Automation Framework (JAVA, Selenium, Cucumber, JUnit, Node.js, Express.js, Jest, Jira, Jenkins)

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

<a href="https://nodejs.org" target="_blank" rel="noreferrer"> 
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="nodejs" width="60" height="60"/> 
</a> 

<a href="https://expressjs.com" target="_blank" rel="noreferrer"> 
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" alt="express" width="60" height="60"/> 
</a> 

<a href="https://jestjs.io" target="_blank" rel="noreferrer"> 
  <img src="https://www.vectorlogo.zone/logos/jestjsio/jestjsio-icon.svg" alt="jest" width="60" height="60"/> 
</a> 
</p>

* JAVA
* SELENIUM
* CUCUMBER
* JUNIT
* JIRA
* JENKINS
* NODE.JS
* EXPRESS.JS
* JEST

### Testinium-QA

This repository contains a comprehensive dual-stack test automation framework that combines:

**Java-based Browser Automation:**
- Selenium WebDriver tests using Cucumber BDD framework
- JUnit test execution with JSON, HTML and TXT reporters
- Automated screenshot capture for test cases and error scenarios

**Node.js HTTP Server Component:**
- Express.js server for API testing and integration validation
- Jest-based unit testing with comprehensive coverage reporting
- RESTful endpoints for test data management and service mocking

This dual-language architecture enables both browser automation testing and server-side API testing within a unified framework, supporting complex end-to-end testing scenarios.

### Installation (pre-requisites)

#### Java Stack Requirements:
1. JDK 1.8+ 
2. Maven 
3. IntelliJ
4. IntelliJ Plugins for
    - Maven
    - Cucumber
5. Browser driver (make sure you have your desired browser driver and class path is set)

#### Node.js Stack Requirements:
1. **Node.js 18.0.0+** (for modern JavaScript features and native fetch API)
2. **npm 8.0.0+** (for workspace support and enhanced dependency management)
3. Recommended IDE extensions:
    - JavaScript/TypeScript support
    - Jest testing framework integration
    - ESLint and Prettier for code formatting

### Framework set up

Git:

    git clone https://github.com/BalamiRR/Testinium-QA.git
 
Manually :

Fork / Clone repository from [here](https://github.com/BalamiRR/Testinium-QA/archive/main.zip) or download zip and set
it up in your local workspace.

## Dual-Stack Architecture

This framework implements a **dual-language architecture** that combines Java-based browser automation with Node.js server-side testing:

### Architecture Overview:
```
┌─────────────────────────────────────────────────┐
│                Testinium-QA                     │
├─────────────────────┬───────────────────────────┤
│     Java Stack      │       Node.js Stack       │
│                     │                           │
│ ┌─────────────────┐ │ ┌───────────────────────┐ │
│ │ Selenium Tests  │ │ │   HTTP Server         │ │
│ │ Cucumber BDD    │ │ │   Express.js          │ │
│ │ JUnit Runner    │ │ │   Jest Tests          │ │
│ └─────────────────┘ │ └───────────────────────┘ │
│                     │                           │
│ ┌─────────────────┐ │ ┌───────────────────────┐ │
│ │ Maven Build     │ │ │   npm Scripts         │ │
│ │ Java 8+         │ │ │   Node.js 18+         │ │
│ └─────────────────┘ │ └───────────────────────┘ │
└─────────────────────┴───────────────────────────┘
```

### Integration Points:
- **Port Isolation**: Java tests run on different ports than Node.js server (3000 dev, 3001 test)
- **Parallel Execution**: Both Maven and npm test suites can run simultaneously
- **Shared Resources**: Common test data and configuration files
- **CI/CD Integration**: Jenkins executes both Java and Node.js test phases

## Node.js Server Setup

### Initial Setup:
```bash
# Install Node.js dependencies
npm install

# Verify installation
node --version  # Should be 18.0.0+
npm --version   # Should be 8.0.0+
```

### Development Commands:

#### Production Server:
```bash
# Start production server (port 3000)
npm start
```

#### Development Server:
```bash
# Start development server with hot reload (port 3000)
npm run dev
```

#### Testing:
```bash
# Run Jest test suite with coverage
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate detailed coverage report
npm run test:coverage
```

#### Code Quality:
```bash
# Lint JavaScript code
npm run lint

# Format code with Prettier
npm run format
```

### Port Configuration:
- **Development Server**: `http://localhost:3000`
- **Test Environment**: `http://localhost:3001`
- **Production**: Configurable via `PORT` environment variable

### API Endpoints:

#### Health Check:
```http
GET /health
Response: { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

#### Test Data Management:
```http
GET /api/test-data          # Retrieve test fixtures
POST /api/test-data         # Create test data
PUT /api/test-data/:id      # Update test data
DELETE /api/test-data/:id   # Delete test data
```

#### Service Mocking:
```http
GET /api/mock/:service      # Mock external service responses
POST /api/mock/reset        # Reset all mocks to default state
```

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


### CI/CD Pipeline Integration

#### Jenkins Dual-Stack Execution:
The CI/CD pipeline executes both Java and Node.js test phases in parallel:

```groovy
// Jenkins Pipeline Stages
stage('Java Tests') {
    steps {
        sh 'mvn clean test'
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'target/cucumber-reports',
            reportFiles: 'index.html',
            reportName: 'Cucumber Report'
        ])
    }
}

stage('Node.js Tests') {
    steps {
        sh 'npm install'
        sh 'npm test'
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'coverage/lcov-report',
            reportFiles: 'index.html',
            reportName: 'Jest Coverage Report'
        ])
    }
}
```

#### Test Reports:
- **Java Stack**: Cucumber HTML reports, Maven Surefire reports
- **Node.js Stack**: Jest coverage reports, test results JSON
- **Integrated Dashboard**: Combined test metrics and coverage analysis

### Jest Test Framework

#### Server Testing Examples:
```javascript
// server.test.js - HTTP endpoint testing
describe('Server API Endpoints', () => {
  test('GET /health returns server status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);
    
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('POST /api/test-data creates new test record', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    const response = await request(app)
      .post('/api/test-data')
      .send(testData)
      .expect(201);
    
    expect(response.body).toMatchObject(testData);
    expect(response.body).toHaveProperty('id');
  });
});
```

#### Coverage Requirements:
- **Minimum Coverage**: 90% code coverage for all server modules
- **Test Categories**: Unit tests, integration tests, error handling tests
- **Performance Tests**: Response time validation (<100ms for all endpoints)

### Jenkins Cucumber Reports
![alt text](./image/Jenkins-Cucumber-Reports.png)

##### Java HTML Report:

To generate HTML report use  `mvn test -Dcucumber.options="–plugin html:target/cucumber-reports.html"`

##### Node.js Jest Report:

To generate Jest coverage report use:
```bash
# Generate HTML coverage report
npm run test:coverage

# Coverage report available at: coverage/lcov-report/index.html
# JSON coverage data: coverage/coverage-final.json
```

##### Txt Report:

To generate a Txt report Use `mvn test -Dcucumber.options="–plugin rerun:target/rerun.txt"`

### Jira Test Execution

  ![alt text](./image/Jira-Test-Exectuion.png)

## Troubleshooting

### Common Issues:

#### Node.js Setup Issues:
```bash
# Check Node.js version
node --version  # Must be 18.0.0+

# Clear npm cache if installation fails
npm cache clean --force
npm install

# Port conflicts
# If port 3000 is in use, set custom port:
PORT=3030 npm start
```

#### Java/Node.js Integration Issues:
```bash
# Ensure both stacks use different ports
# Java tests: Configure to avoid 3000-3001 range
# Node.js: Uses 3000 (dev) and 3001 (test)

# CI/CD Pipeline Issues:
# Verify both Node.js and Java are available in CI environment
# Check Jenkins has access to both mvn and npm commands
```

#### Test Execution Issues:
```bash
# Java tests
mvn clean test -Dtest=CukesRunner

# Node.js tests  
npm test -- --verbose

# Run specific test file
npm test -- server.test.js
```

### Performance Optimization:
- **Java**: Use parallel test execution: `mvn test -Dparallel=methods`
- **Node.js**: Use Jest parallel workers: `npm test -- --maxWorkers=4`
- **CI/CD**: Cache Maven dependencies and node_modules between builds

### THE END

