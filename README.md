 # :fallen_leaf: :leaves: Testinium-QA :leaves: :fallen_leaf:
Dual-Technology Test Automation Framework: Java/Selenium/Cucumber + Node.js/Express.js REST API Server
(JAVA, Selenium, Cucumber, JUnit, Node.js, Express.js, Jira, Jenkins)

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
</p>

**Java Test Automation Stack:**
* JAVA
* SELENIUM
* CUCUMBER
* JUNIT

**Node.js REST API Stack:**
* NODE.JS
* EXPRESS.JS

**Integration & Management:**
* JIRA
* JENKINS

### Testinium-QA

This repository contains a **dual-technology framework** combining:

1. **Java Test Automation Framework**: Complete Cucumber BDD framework with Java for browser automation, featuring JSON, HTML and TXT reporters, screenshot capture for tests, and error shots for failed test cases.

2. **Node.js Express.js REST API Server**: Fully operational Express.js v4.18.0+ server with two complete REST endpoints (/ and /evening) for integration testing and demonstration purposes.

Both components operate independently and are fully functional, providing a comprehensive testing and API solution.

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

## Node.js Express.js REST API Server

### Current Status: ✅ Fully Operational

**Express.js v4.18.0+ is fully integrated** with **both endpoints completely implemented and working**.

### Overview

This repository includes a **fully operational Node.js Express.js v4.18.0+ REST API server** that operates independently alongside the Java-based test automation framework. The Express.js server provides **two complete REST endpoints** for demonstration and integration purposes, with both endpoints fully implemented and ready for use.

### Prerequisites

Before running the Node.js server, ensure you have the following installed:

- **Node.js**: Version 14.x or higher (LTS recommended)
- **npm**: Node.js package manager (bundled with Node.js installation)

You can verify your installation by running:
```bash
node --version
npm --version
```

### Node.js Setup Instructions

1. **Navigate to the node-server directory:**
   ```bash
   cd node-server
   ```

2. **Install Express.js dependencies:**
   ```bash
   npm install
   ```
   This command will install **Express.js v4.18.0+** (already configured in package.json) and create a `package-lock.json` file for dependency version locking.

3. **Start the Express.js server:**
   ```bash
   node server.js
   ```
   The server will start and display startup messages confirming **both endpoints are active and ready**:
   ```
   Server is running on port 3000
   Access endpoints:
     GET / - Returns "Hello world"
     GET /evening - Returns "Good evening"
   ```

### Available Endpoints

The Express.js server provides **two fully operational REST API endpoints**:

#### ✅ GET / - Returns "Hello world"
```bash
curl http://localhost:3000/
# Response: Hello world
```

#### ✅ GET /evening - Returns "Good evening"
```bash
curl http://localhost:3000/evening
# Response: Good evening
```

**Status**: Both endpoints are **fully implemented and operational**.

### Quick Test

To verify both endpoints are working, run these commands after starting the server:

```bash
# Test first endpoint
curl http://localhost:3000/
# Expected response: Hello world

# Test second endpoint  
curl http://localhost:3000/evening
# Expected response: Good evening
```

✅ **Both endpoints return their expected responses and are ready for integration testing.**

### Port Configuration

The server runs on **port 3000** by default. You can configure a different port by setting the `PORT` environment variable:

```bash
# Use a custom port
PORT=8080 node server.js

# Or set environment variable
export PORT=8080
node server.js
```

### Integration Notes

**Fully Operational Express.js Server**: The Express.js v4.18.0+ server is completely implemented and operates independently from the Java-based test automation framework. Both components are production-ready and can run simultaneously without conflicts:

- **Java Framework**: Fully handles Selenium WebDriver tests, Cucumber BDD scenarios, and JUnit test execution
- **Express.js Server**: Provides **two complete REST API endpoints** (/ and /evening) for external integration, testing, and demonstration purposes

**Development Workflow**: Both components are fully functional and developers can work on either component independently:
1. **Java/Maven workflow**: Complete test automation framework with Selenium, Cucumber, and JUnit
2. **Node.js/Express workflow**: Fully operational REST API server with dual endpoints
3. **Dual-technology architecture**: Both components coexist with separate build processes and full functionality



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
  

  

### THE END

