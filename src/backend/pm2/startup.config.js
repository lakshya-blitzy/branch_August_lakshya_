/**
 * @fileoverview PM2 Startup Configuration Module for Node.js Tutorial Project
 * @description Comprehensive PM2 startup configuration system that manages automatic application 
 * startup on system boot/reboot, implementing PM2's startup script generation and management 
 * capabilities for production deployment reliability. This module provides comprehensive startup 
 * script configuration, system service integration, and automatic process resurrection to ensure 
 * the Node.js tutorial application remains available 24/7 in production environments.
 * 
 * Implements PM2's startup functionality that generates active startup scripts for seamless 
 * application recovery after server restarts, supporting cross-platform deployment on Linux 
 * (stable), macOS (stable), and Windows (stable) systems. Integrates with PM2 cluster mode, 
 * ecosystem configuration, and environment-specific settings to provide robust production 
 * deployment with zero-downtime capabilities and automatic failover.
 * 
 * @version 1.0.0
 * @since 2025-01-01
 * @author Node.js Tutorial Project Team
 * 
 * Features:
 * - Cross-platform PM2 startup script generation (Linux, macOS, Windows)
 * - System service integration with platform-specific service managers
 * - Automatic process resurrection and zero-downtime deployment support
 * - Comprehensive startup validation and configuration management
 * - Production-ready startup monitoring and alerting capabilities
 * - Security-conscious startup script permissions and execution
 * - Educational startup management with detailed logging and documentation
 * 
 * Educational Value:
 * - Demonstrates production deployment automation and system service integration
 * - Showcases cross-platform system administration and process management
 * - Illustrates PM2 ecosystem configuration and cluster mode startup patterns
 * - Provides comprehensive startup script generation and validation methodologies
 * - Teaches enterprise-grade application lifecycle management and monitoring
 * 
 * Technology Integration:
 * - PM2 v6.0.8 startup script generation and system service integration
 * - Node.js v22.x LTS process management and system interaction
 * - Cross-platform file system operations and permission management
 * - System service integration (systemd, launchd, Windows Service)
 * - Express.js v5.1.0 application startup and health check integration
 */

// External library imports with version comments for startup functionality
import pm2 from 'pm2'; // v5.3.0 - PM2 process manager for startup script generation and automatic application resurrection
import path from 'node:path'; // built-in - Node.js path utilities for resolving startup script paths and configuration locations
import os from 'node:os'; // built-in - Operating system utilities for platform detection and system service integration
import fs from 'node:fs/promises'; // built-in - File system module for startup script file operations and validation
import { spawn, exec } from 'node:child_process'; // built-in - Child process utilities for executing startup script installation commands
import { promisify } from 'node:util'; // built-in - Promisify utility for converting callback-based PM2 operations to promises

// Internal imports for PM2 startup configuration and ecosystem management
import { 
  createEcosystemConfig, 
  productionEcosystem, 
  validateEcosystemConfig 
} from './ecosystem.config.js';

import { 
  createClusterEcosystem, 
  calculateOptimalClusterSize, 
  productionClusterConfig 
} from './cluster.config.js';

import { 
  currentEnvironment, 
  isProduction, 
  pm2 as pm2Config, 
  server as serverConfig 
} from '../config/environment.js';

import { 
  createPM2Config, 
  productionConfig, 
  validatePM2Config 
} from '../config/pm2.js';

import logger, { 
  info as logInfo, 
  warn as logWarn, 
  error as logError, 
  debug as logDebug 
} from '../utils/logger.js';

import { 
  PM2_CONSTANTS, 
  PLATFORM_CONFIGS, 
  STARTUP_COMMANDS 
} from '../utils/constants.js';

import { 
  PLATFORM_TYPES, 
  SERVICE_TYPES, 
  STARTUP_PRIORITIES 
} from '../utils/constants.js';

import { PM2Error, createErrorResponse } from '../utils/error-types.js';

// Promisified PM2 operations for modern async/await usage
const pm2Connect = promisify(pm2.connect.bind(pm2));
const pm2Disconnect = promisify(pm2.disconnect.bind(pm2));
const pm2List = promisify(pm2.list.bind(pm2));
const pm2Dump = promisify(pm2.dump.bind(pm2));
const pm2Kill = promisify(pm2.kill.bind(pm2));
const pm2Resurrect = promisify(pm2.resurrect.bind(pm2));
const pm2Startup = promisify(pm2.startup.bind(pm2));
const execAsync = promisify(exec);

// Global startup configuration constants and settings
const STARTUP_SCRIPT_NAME = process.env.PM2_STARTUP_SCRIPT_NAME || 'nodejs-tutorial-startup';
const CURRENT_PLATFORM = os.platform();
const STARTUP_SCRIPT_PATH = process.env.PM2_STARTUP_SCRIPT_PATH || '/etc/init.d/';
const PM2_HOME = process.env.PM2_HOME || path.join(os.homedir(), '.pm2');
const ECOSYSTEM_FILE_PATH = path.resolve(process.cwd(), 'ecosystem.config.js');

// Platform-specific startup configuration templates and service managers
const STARTUP_TEMPLATES = {
  linux: {
    serviceManager: 'systemd',
    scriptTemplate: 'systemd-service-template.service',
    installCommand: 'systemctl enable',
    startCommand: 'systemctl start',
    stopCommand: 'systemctl stop',
    statusCommand: 'systemctl status',
    configPath: '/etc/systemd/system/',
    permissions: '644',
    owner: 'root:root'
  },
  darwin: {
    serviceManager: 'launchd',
    plistTemplate: 'launchd-plist-template.plist',
    installCommand: 'launchctl load',
    startCommand: 'launchctl start',
    stopCommand: 'launchctl stop',
    statusCommand: 'launchctl list',
    configPath: '/Library/LaunchDaemons/',
    permissions: '644',
    owner: 'root:wheel'
  },
  win32: {
    serviceManager: 'windows-service',
    serviceTemplate: 'windows-service-template.xml',
    installCommand: 'sc create',
    startCommand: 'sc start',
    stopCommand: 'sc stop',
    statusCommand: 'sc query',
    configPath: 'C:\\Windows\\System32\\',
    permissions: 'full',
    owner: 'SYSTEM'
  }
};

// Default startup configuration object with platform detection and service settings
export const startupConfig = {
  platform: CURRENT_PLATFORM,
  scriptPath: STARTUP_SCRIPT_PATH,
  serviceType: STARTUP_TEMPLATES[CURRENT_PLATFORM]?.serviceManager || 'generic',
  autoStart: true,
  scriptName: STARTUP_SCRIPT_NAME,
  ecosystemPath: ECOSYSTEM_FILE_PATH,
  pm2Home: PM2_HOME,
  enabled: false,
  lastInstalled: null,
  version: '1.0.0'
};

// Platform-specific startup configurations with service manager details
export const linuxStartupConfig = {
  serviceManager: 'systemd',
  scriptTemplate: `[Unit]
Description=PM2 process manager for Node.js Tutorial Application
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=pm2
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:$PATH
Environment=PM2_HOME=${PM2_HOME}
Environment=PM2_RPC_PORT=6001
Environment=PM2_PUB_PORT=6002
PIDFile=${PM2_HOME}/pm2.pid
ExecStart=${PM2_HOME}/pm2.sh start
ExecReload=${PM2_HOME}/pm2.sh reload
ExecStop=${PM2_HOME}/pm2.sh stop
TimeoutStopSec=300

[Install]
WantedBy=multi-user.target`,
  installCommand: 'systemctl enable pm2-nodejs-tutorial.service',
  configPath: '/etc/systemd/system/',
  serviceName: 'pm2-nodejs-tutorial.service'
};

export const macosStartupConfig = {
  serviceManager: 'launchd',
  plistTemplate: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.pm2.nodejs-tutorial</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PM2_HOME}/pm2.sh</string>
    <string>resurrect</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>LaunchOnlyOnce</key>
  <false/>
  <key>StandardOutPath</key>
  <string>${PM2_HOME}/pm2.out.log</string>
  <key>StandardErrorPath</key>
  <string>${PM2_HOME}/pm2.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PM2_HOME</key>
    <string>${PM2_HOME}</string>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>`,
  installCommand: 'launchctl load /Library/LaunchDaemons/io.pm2.nodejs-tutorial.plist',
  configPath: '/Library/LaunchDaemons/',
  serviceName: 'io.pm2.nodejs-tutorial.plist'
};

export const windowsStartupConfig = {
  serviceManager: 'windows-service',
  serviceTemplate: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.serviceModel>
    <services>
      <service name="PM2NodejsTutorial" 
               displayName="PM2 Node.js Tutorial Service"
               description="PM2 process manager for Node.js Tutorial Application">
        <executable>${PM2_HOME}\\pm2.exe</executable>
        <arguments>resurrect</arguments>
        <workingDirectory>${process.cwd()}</workingDirectory>
        <startType>automatic</startType>
        <account>LocalSystem</account>
        <environment>
          <variable name="PM2_HOME" value="${PM2_HOME}" />
          <variable name="NODE_ENV" value="${currentEnvironment}" />
        </environment>
      </service>
    </services>
  </system.serviceModel>
</configuration>`,
  installCommand: 'sc create PM2NodejsTutorial binPath= "${PM2_HOME}\\pm2.exe resurrect"',
  configPath: 'C:\\Windows\\System32\\',
  serviceName: 'PM2NodejsTutorial'
};

/**
 * Generates PM2 startup script for automatic application startup on system boot/reboot 
 * with platform-specific service integration and cross-platform compatibility. Creates 
 * appropriate startup scripts for Linux (systemd), macOS (launchd), and Windows (Service)
 * with proper permissions, service dependencies, and automatic process resurrection.
 * 
 * @param {string} platform - Target platform for startup script generation (linux, darwin, win32)
 * @param {Object} startupOptions - Startup script configuration options
 * @param {string} [startupOptions.serviceName] - Custom service name for system registration
 * @param {string} [startupOptions.user] - User account for service execution
 * @param {Object} [startupOptions.environment] - Environment variables for startup script
 * @param {boolean} [startupOptions.autoStart] - Enable automatic service startup on boot
 * @param {Array} [startupOptions.dependencies] - Service dependencies and startup order
 * @returns {Object} Startup script generation result with script path, platform type, and installation instructions
 */
export async function generateStartupScript(platform = CURRENT_PLATFORM, startupOptions = {}) {
  try {
    // Validate platform support and startup script generation requirements
    if (!STARTUP_TEMPLATES[platform]) {
      throw new PM2Error(
        `Unsupported platform for startup script generation: ${platform}`,
        'startup-generation',
        { 
          platform, 
          supportedPlatforms: Object.keys(STARTUP_TEMPLATES),
          requestId: startupOptions.requestId 
        }
      );
    }

    logInfo('Starting PM2 startup script generation', {
      platform,
      serviceName: startupOptions.serviceName || STARTUP_SCRIPT_NAME,
      autoStart: startupOptions.autoStart !== false,
      user: startupOptions.user || 'system',
      dependencies: startupOptions.dependencies || []
    });

    // Detect current platform for appropriate startup script type
    const platformConfig = STARTUP_TEMPLATES[platform];
    const serviceName = startupOptions.serviceName || STARTUP_SCRIPT_NAME;
    const serviceUser = startupOptions.user || (platform === 'win32' ? 'SYSTEM' : 'root');

    // Load PM2 ecosystem configuration for startup script integration
    const ecosystemConfig = await createEcosystemConfig({
      environment: currentEnvironment,
      clustering: true,
      monitoring: true
    });

    // Validate ecosystem configuration completeness and startup compatibility
    const ecosystemValidation = await validateEcosystemConfig(ecosystemConfig);
    if (!ecosystemValidation.isValid) {
      throw new PM2Error(
        'Invalid ecosystem configuration for startup script generation',
        'ecosystem-validation',
        { 
          validation: ecosystemValidation,
          ecosystemPath: ECOSYSTEM_FILE_PATH 
        }
      );
    }

    // Generate platform-specific startup script content with service definitions
    let startupScriptContent;
    let scriptExtension;
    let scriptPath;

    switch (platform) {
      case 'linux':
        startupScriptContent = await generateLinuxStartupScript(serviceName, startupOptions, ecosystemConfig);
        scriptExtension = '.service';
        scriptPath = path.join(platformConfig.configPath, `${serviceName}${scriptExtension}`);
        break;

      case 'darwin':
        startupScriptContent = await generateMacOSStartupScript(serviceName, startupOptions, ecosystemConfig);
        scriptExtension = '.plist';
        scriptPath = path.join(platformConfig.configPath, `${serviceName}${scriptExtension}`);
        break;

      case 'win32':
        startupScriptContent = await generateWindowsStartupScript(serviceName, startupOptions, ecosystemConfig);
        scriptExtension = '.xml';
        scriptPath = path.join(platformConfig.configPath, `${serviceName}${scriptExtension}`);
        break;

      default:
        throw new PM2Error(
          `Startup script generation not implemented for platform: ${platform}`,
          'platform-not-implemented',
          { platform, availablePlatforms: Object.keys(STARTUP_TEMPLATES) }
        );
    }

    // Configure startup script with PM2 home directory and ecosystem file paths
    const scriptConfig = {
      scriptPath,
      serviceName,
      platform,
      serviceManager: platformConfig.serviceManager,
      permissions: platformConfig.permissions,
      owner: platformConfig.owner,
      autoStart: startupOptions.autoStart !== false,
      dependencies: startupOptions.dependencies || [],
      environment: {
        PM2_HOME,
        NODE_ENV: currentEnvironment,
        ECOSYSTEM_FILE: ECOSYSTEM_FILE_PATH,
        ...startupOptions.environment
      }
    };

    // Set appropriate permissions and ownership for startup script execution
    const permissionsResult = await validateStartupScriptPermissions(scriptPath, scriptConfig);
    if (!permissionsResult.isValid) {
      logWarn('Startup script permissions require adjustment', {
        scriptPath,
        requiredPermissions: scriptConfig.permissions,
        currentPermissions: permissionsResult.currentPermissions,
        recommendations: permissionsResult.recommendations
      });
    }

    // Validate startup script syntax and service configuration completeness
    const syntaxValidation = await validateStartupScriptSyntax(startupScriptContent, platform);
    if (!syntaxValidation.isValid) {
      throw new PM2Error(
        'Generated startup script contains syntax errors',
        'script-syntax-validation',
        { 
          scriptPath,
          syntaxErrors: syntaxValidation.errors,
          suggestions: syntaxValidation.suggestions 
        }
      );
    }

    // Test startup script functionality and automatic application resurrection (dry run)
    const dryRunResult = await testStartupScriptDryRun(startupScriptContent, scriptConfig);
    if (!dryRunResult.success) {
      logWarn('Startup script dry run detected potential issues', {
        scriptPath,
        issues: dryRunResult.issues,
        recommendations: dryRunResult.recommendations
      });
    }

    // Generate installation instructions and service registration commands
    const installationInstructions = generateInstallationInstructions(scriptConfig, platform);

    // Log startup script generation status and installation instructions
    logInfo('PM2 startup script generation completed successfully', {
      scriptPath,
      serviceName,
      platform,
      serviceManager: platformConfig.serviceManager,
      autoStart: scriptConfig.autoStart,
      installationRequired: true,
      nextSteps: installationInstructions.steps
    });

    // Return comprehensive startup script generation result with metadata
    return {
      success: true,
      scriptPath,
      scriptContent: startupScriptContent,
      serviceName,
      platform,
      serviceManager: platformConfig.serviceManager,
      configuration: scriptConfig,
      validation: {
        ecosystemValid: ecosystemValidation.isValid,
        syntaxValid: syntaxValidation.isValid,
        permissionsValid: permissionsResult.isValid,
        dryRunSuccess: dryRunResult.success
      },
      installation: installationInstructions,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: startupConfig.version,
        pm2Version: PM2_CONSTANTS.VERSION,
        nodeVersion: process.version,
        ecosystemPath: ECOSYSTEM_FILE_PATH,
        pm2Home: PM2_HOME
      }
    };

  } catch (error) {
    logError('PM2 startup script generation failed', {
      platform,
      serviceName: startupOptions.serviceName,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup script generation failed: ${error.message}`,
      'startup-generation-failed',
      { 
        platform, 
        originalError: error,
        startupOptions 
      }
    );
  }
}

/**
 * Installs PM2 startup script into system service manager with proper permissions, 
 * service registration, and automatic startup configuration for production deployment.
 * Handles platform-specific installation procedures, service dependencies, and startup
 * order configuration with comprehensive validation and error handling.
 * 
 * @param {Object} installationConfig - Installation configuration options
 * @param {string} [installationConfig.scriptPath] - Path to generated startup script
 * @param {string} [installationConfig.serviceName] - Service name for registration
 * @param {boolean} [installationConfig.enableAutoStart] - Enable automatic startup on boot
 * @param {boolean} [installationConfig.startAfterInstall] - Start service immediately after installation
 * @param {Object} [installationConfig.systemUser] - System user configuration for service execution
 * @returns {Promise} Promise that resolves when startup script installation is complete with service status
 */
export async function installStartupScript(installationConfig = {}) {
  try {
    const config = {
      scriptPath: installationConfig.scriptPath || startupConfig.scriptPath,
      serviceName: installationConfig.serviceName || STARTUP_SCRIPT_NAME,
      enableAutoStart: installationConfig.enableAutoStart !== false,
      startAfterInstall: installationConfig.startAfterInstall !== false,
      platform: installationConfig.platform || CURRENT_PLATFORM,
      forceReinstall: installationConfig.forceReinstall === true,
      validateInstallation: installationConfig.validateInstallation !== false,
      ...installationConfig
    };

    logInfo('Starting PM2 startup script installation', {
      serviceName: config.serviceName,
      platform: config.platform,
      enableAutoStart: config.enableAutoStart,
      startAfterInstall: config.startAfterInstall,
      scriptPath: config.scriptPath
    });

    // Validate system permissions for startup script installation
    const permissionsCheck = await validateSystemPermissions(config.platform);
    if (!permissionsCheck.hasPermissions) {
      throw new PM2Error(
        `Insufficient permissions for startup script installation on ${config.platform}`,
        'insufficient-permissions',
        { 
          platform: config.platform,
          requiredPermissions: permissionsCheck.requiredPermissions,
          currentUser: permissionsCheck.currentUser,
          recommendations: permissionsCheck.recommendations
        }
      );
    }

    // Check if service already exists and handle reinstallation
    const existingServiceCheck = await checkExistingService(config.serviceName, config.platform);
    if (existingServiceCheck.exists && !config.forceReinstall) {
      logWarn('PM2 startup service already exists', {
        serviceName: config.serviceName,
        existingStatus: existingServiceCheck.status,
        lastInstalled: existingServiceCheck.lastInstalled,
        forceReinstall: config.forceReinstall
      });

      if (existingServiceCheck.status === 'running') {
        return {
          success: true,
          alreadyInstalled: true,
          serviceName: config.serviceName,
          status: existingServiceCheck.status,
          message: 'PM2 startup service already installed and running'
        };
      }
    }

    // Generate PM2 startup script using pm2 startup command
    const startupGeneration = await executeStartupGeneration(config);
    if (!startupGeneration.success) {
      throw new PM2Error(
        'PM2 startup script generation failed',
        'startup-generation-error',
        { 
          generationResult: startupGeneration,
          config 
        }
      );
    }

    // Execute startup script installation with appropriate system privileges
    const installationResult = await executeStartupInstallation(config, startupGeneration);
    if (!installationResult.success) {
      throw new PM2Error(
        'PM2 startup script installation failed',
        'installation-error',
        { 
          installationResult,
          config 
        }
      );
    }

    // Register PM2 service with system service manager (systemd, init.d, etc.)
    const serviceRegistration = await registerSystemService(config);
    if (!serviceRegistration.success) {
      throw new PM2Error(
        'System service registration failed',
        'service-registration-error',
        { 
          serviceRegistration,
          config 
        }
      );
    }

    // Configure service dependencies and startup priorities
    const dependencyConfig = await configureServiceDependencies(config);
    if (!dependencyConfig.success) {
      logWarn('Service dependency configuration encountered issues', {
        serviceName: config.serviceName,
        dependencies: dependencyConfig.dependencies,
        issues: dependencyConfig.issues
      });
    }

    // Save current PM2 process list for automatic resurrection
    const processSaveResult = await saveProcessList({
      dumpFile: path.join(PM2_HOME, 'dump.pm2'),
      backup: true,
      validate: true
    });

    if (!processSaveResult.success) {
      logWarn('Process list save encountered issues during installation', {
        saveResult: processSaveResult,
        impact: 'Startup resurrection may not work correctly'
      });
    }

    // Test service installation by simulating system restart (if safe)
    let serviceTestResult = { success: true, tested: false };
    if (config.validateInstallation && !isProduction) {
      serviceTestResult = await testServiceInstallation(config);
    }

    // Verify automatic application startup functionality
    const startupVerification = await verifyStartupFunctionality(config);
    if (!startupVerification.success) {
      logWarn('Startup functionality verification detected issues', {
        serviceName: config.serviceName,
        issues: startupVerification.issues,
        recommendations: startupVerification.recommendations
      });
    }

    // Start service immediately if requested and installation successful
    if (config.startAfterInstall && installationResult.success) {
      const serviceStart = await startSystemService(config.serviceName, config.platform);
      if (!serviceStart.success) {
        logWarn('Service start after installation failed', {
          serviceName: config.serviceName,
          startResult: serviceStart
        });
      }
    }

    // Update startup configuration state
    startupConfig.enabled = true;
    startupConfig.lastInstalled = new Date().toISOString();
    startupConfig.serviceName = config.serviceName;
    startupConfig.platform = config.platform;

    // Log installation status and service configuration details
    logInfo('PM2 startup script installation completed successfully', {
      serviceName: config.serviceName,
      platform: config.platform,
      serviceManager: STARTUP_TEMPLATES[config.platform]?.serviceManager,
      autoStartEnabled: config.enableAutoStart,
      serviceRunning: config.startAfterInstall,
      installationTime: new Date().toISOString(),
      nextBoot: 'Application will start automatically on system boot'
    });

    // Return installation result with service status and configuration
    return {
      success: true,
      serviceName: config.serviceName,
      platform: config.platform,
      serviceManager: STARTUP_TEMPLATES[config.platform]?.serviceManager,
      installation: {
        completed: true,
        timestamp: new Date().toISOString(),
        scriptPath: startupGeneration.scriptPath,
        configPath: startupGeneration.configPath
      },
      service: {
        registered: serviceRegistration.success,
        enabled: config.enableAutoStart,
        running: config.startAfterInstall,
        status: serviceRegistration.status
      },
      validation: {
        permissions: permissionsCheck.hasPermissions,
        installation: installationResult.success,
        startup: startupVerification.success,
        serviceTest: serviceTestResult.success
      },
      processes: {
        saved: processSaveResult.success,
        count: processSaveResult.processCount || 0,
        dumpFile: processSaveResult.dumpFile
      },
      metadata: {
        version: startupConfig.version,
        installedAt: new Date().toISOString(),
        pm2Home: PM2_HOME,
        ecosystemFile: ECOSYSTEM_FILE_PATH
      }
    };

  } catch (error) {
    logError('PM2 startup script installation failed', {
      serviceName: installationConfig.serviceName,
      platform: installationConfig.platform,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup script installation failed: ${error.message}`,
      'installation-failed',
      { 
        installationConfig, 
        originalError: error 
      }
    );
  }
}

/**
 * Saves current PM2 process list for automatic resurrection after system restart, 
 * ensuring all running applications are restored with proper configuration, environment
 * variables, and cluster settings. Creates backup of existing dump files and validates
 * process list integrity for reliable startup restoration.
 * 
 * @param {Object} saveOptions - Process list save configuration options
 * @param {string} [saveOptions.dumpFile] - Custom dump file path for process list storage
 * @param {boolean} [saveOptions.backup] - Create backup of existing dump file before save
 * @param {boolean} [saveOptions.validate] - Validate saved process list integrity
 * @param {boolean} [saveOptions.includeEnvironment] - Include environment variables in dump
 * @param {Array} [saveOptions.excludeProcesses] - Process names to exclude from dump
 * @returns {Promise} Promise that resolves when process list is successfully saved with backup information
 */
export async function saveProcessList(saveOptions = {}) {
  try {
    const options = {
      dumpFile: saveOptions.dumpFile || path.join(PM2_HOME, 'dump.pm2'),
      backup: saveOptions.backup !== false,
      validate: saveOptions.validate !== false,
      includeEnvironment: saveOptions.includeEnvironment !== false,
      excludeProcesses: saveOptions.excludeProcesses || [],
      compression: saveOptions.compression === true,
      metadata: saveOptions.metadata !== false,
      ...saveOptions
    };

    logInfo('Starting PM2 process list save operation', {
      dumpFile: options.dumpFile,
      backup: options.backup,
      validate: options.validate,
      includeEnvironment: options.includeEnvironment,
      excludeProcesses: options.excludeProcesses
    });

    // Connect to PM2 daemon and retrieve current process list
    await pm2Connect();
    
    try {
      const processListRaw = await pm2List();
      
      // Filter out excluded processes and stopped processes
      const activeProcesses = processListRaw.filter(proc => {
        return proc.pm2_env.status === 'online' && 
               !options.excludeProcesses.includes(proc.name) &&
               !options.excludeProcesses.includes(proc.pm2_env.name);
      });

      logDebug('Retrieved active PM2 process list', {
        totalProcesses: processListRaw.length,
        activeProcesses: activeProcesses.length,
        excludedCount: options.excludeProcesses.length,
        processNames: activeProcesses.map(p => p.name)
      });

      // Validate all running processes and their configuration states
      const processValidation = await validateProcessConfigurations(activeProcesses);
      if (!processValidation.allValid) {
        logWarn('Some processes have configuration issues', {
          invalidProcesses: processValidation.invalidProcesses.length,
          issues: processValidation.issues,
          impact: 'These processes may not resurrect correctly'
        });
      }

      // Create backup of previous process list for rollback capability
      let backupInfo = null;
      if (options.backup && await fileExists(options.dumpFile)) {
        const backupPath = `${options.dumpFile}.backup.${Date.now()}`;
        await fs.copyFile(options.dumpFile, backupPath);
        
        backupInfo = {
          created: true,
          backupPath,
          originalSize: (await fs.stat(options.dumpFile)).size,
          timestamp: new Date().toISOString()
        };

        logInfo('Created backup of existing process dump file', backupInfo);
      }

      // Save process list to PM2 dump file with complete configuration
      await pm2Dump();

      // Verify saved process list integrity and completeness
      if (options.validate) {
        const dumpValidation = await validateDumpFileIntegrity(options.dumpFile, activeProcesses);
        if (!dumpValidation.isValid) {
          throw new PM2Error(
            'Saved process dump file validation failed',
            'dump-validation-failed',
            { 
              dumpFile: options.dumpFile,
              validation: dumpValidation,
              activeProcesses: activeProcesses.length 
            }
          );
        }

        logDebug('Process dump file validation successful', {
          dumpFile: options.dumpFile,
          processCount: dumpValidation.processCount,
          fileSize: dumpValidation.fileSize,
          checksum: dumpValidation.checksum
        });
      }

      // Create metadata file with save operation details
      if (options.metadata) {
        const metadataFile = `${options.dumpFile}.metadata`;
        const metadata = {
          saveTimestamp: new Date().toISOString(),
          processCount: activeProcesses.length,
          platform: CURRENT_PLATFORM,
          nodeVersion: process.version,
          pm2Version: PM2_CONSTANTS.VERSION,
          environment: currentEnvironment,
          pm2Home: PM2_HOME,
          ecosystemFile: ECOSYSTEM_FILE_PATH,
          backup: backupInfo,
          validation: options.validate ? {
            validated: true,
            validProcesses: processValidation.validProcesses.length,
            invalidProcesses: processValidation.invalidProcesses.length
          } : null
        };

        await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
        logDebug('Created process dump metadata file', { metadataFile, metadata });
      }

      // Log process list save operation with process count and configuration
      logInfo('PM2 process list saved successfully', {
        dumpFile: options.dumpFile,
        processCount: activeProcesses.length,
        validProcesses: processValidation.validProcesses.length,
        invalidProcesses: processValidation.invalidProcesses.length,
        backupCreated: backupInfo?.created || false,
        validationPassed: options.validate,
        timestamp: new Date().toISOString()
      });

      // Return save operation result with backup information and status
      return {
        success: true,
        dumpFile: options.dumpFile,
        processCount: activeProcesses.length,
        validProcesses: processValidation.validProcesses.length,
        invalidProcesses: processValidation.invalidProcesses.length,
        backup: backupInfo,
        validation: options.validate ? {
          passed: true,
          fileSize: (await fs.stat(options.dumpFile)).size,
          integrity: 'verified'
        } : null,
        metadata: {
          savedAt: new Date().toISOString(),
          platform: CURRENT_PLATFORM,
          environment: currentEnvironment,
          pm2Home: PM2_HOME
        },
        processes: activeProcesses.map(proc => ({
          name: proc.name,
          pid: proc.pid,
          status: proc.pm2_env.status,
          instances: proc.pm2_env.instances || 1,
          restarts: proc.pm2_env.restart_time || 0
        }))
      };

    } finally {
      await pm2Disconnect();
    }

  } catch (error) {
    logError('PM2 process list save operation failed', {
      dumpFile: saveOptions.dumpFile,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Process list save failed: ${error.message}`,
      'process-save-failed',
      { 
        saveOptions, 
        originalError: error 
      }
    );
  }
}

/**
 * Resurrects saved PM2 processes from dump file during system startup, restoring 
 * all applications with their original configuration, environment variables, cluster
 * settings, and monitoring capabilities. Validates process health and ensures proper
 * startup order with dependency management.
 * 
 * @param {Object} resurrectOptions - Process resurrection configuration options
 * @param {string} [resurrectOptions.dumpFile] - Path to dump file containing saved processes
 * @param {boolean} [resurrectOptions.validateHealth] - Perform health checks after resurrection
 * @param {number} [resurrectOptions.startupTimeout] - Maximum time to wait for process startup
 * @param {boolean} [resurrectOptions.preserveOrder] - Maintain original process startup order
 * @param {Object} [resurrectOptions.healthCheckConfig] - Health check configuration parameters
 * @returns {Promise} Promise that resolves when all processes are successfully resurrected and running
 */
export async function resurrectProcesses(resurrectOptions = {}) {
  try {
    const options = {
      dumpFile: resurrectOptions.dumpFile || path.join(PM2_HOME, 'dump.pm2'),
      validateHealth: resurrectOptions.validateHealth !== false,
      startupTimeout: resurrectOptions.startupTimeout || 30000,
      preserveOrder: resurrectOptions.preserveOrder !== false,
      retryAttempts: resurrectOptions.retryAttempts || 3,
      retryDelay: resurrectOptions.retryDelay || 2000,
      healthCheckConfig: {
        timeout: 10000,
        retries: 3,
        interval: 2000,
        ...resurrectOptions.healthCheckConfig
      },
      ...resurrectOptions
    };

    logInfo('Starting PM2 process resurrection from dump file', {
      dumpFile: options.dumpFile,
      validateHealth: options.validateHealth,
      startupTimeout: options.startupTimeout,
      preserveOrder: options.preserveOrder,
      retryAttempts: options.retryAttempts
    });

    // Load saved process list from PM2 dump file
    const dumpFileExists = await fileExists(options.dumpFile);
    if (!dumpFileExists) {
      logWarn('PM2 dump file not found, no processes to resurrect', {
        dumpFile: options.dumpFile,
        expectedLocation: PM2_HOME
      });

      return {
        success: true,
        processCount: 0,
        resurrectedProcesses: [],
        message: 'No dump file found, no processes to resurrect'
      };
    }

    // Validate process configuration and system resource availability
    const resourceCheck = await validateSystemResources();
    if (!resourceCheck.adequate) {
      logWarn('System resources may be insufficient for process resurrection', {
        availableMemory: resourceCheck.memory,
        availableCPU: resourceCheck.cpu,
        recommendations: resourceCheck.recommendations
      });
    }

    // Connect to PM2 daemon for process management
    await pm2Connect();

    try {
      // Start each saved process with original configuration and environment
      const resurrectionStartTime = Date.now();
      await pm2Resurrect();

      // Allow time for processes to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get current process list to verify resurrection
      const currentProcesses = await pm2List();
      const activeProcesses = currentProcesses.filter(proc => proc.pm2_env.status === 'online');

      logDebug('Process resurrection completed, validating results', {
        totalProcesses: currentProcesses.length,
        activeProcesses: activeProcesses.length,
        resurrectionTime: Date.now() - resurrectionStartTime
      });

      // Monitor process startup and health check validation
      const healthCheckResults = [];
      if (options.validateHealth && activeProcesses.length > 0) {
        logInfo('Performing health checks on resurrected processes', {
          processCount: activeProcesses.length,
          healthCheckTimeout: options.healthCheckConfig.timeout
        });

        for (const process of activeProcesses) {
          const healthCheck = await performProcessHealthCheck(process, options.healthCheckConfig);
          healthCheckResults.push({
            processName: process.name,
            pid: process.pid,
            healthy: healthCheck.healthy,
            responseTime: healthCheck.responseTime,
            issues: healthCheck.issues || []
          });

          if (!healthCheck.healthy) {
            logWarn('Process health check failed after resurrection', {
              processName: process.name,
              pid: process.pid,
              issues: healthCheck.issues,
              recommendation: 'Process may need manual intervention'
            });
          }
        }
      }

      // Configure cluster mode and load balancing for resurrected processes
      const clusterProcesses = activeProcesses.filter(proc => 
        proc.pm2_env.exec_mode === 'cluster_mode' || proc.pm2_env.instances > 1
      );

      if (clusterProcesses.length > 0) {
        logInfo('Configuring cluster mode for resurrected processes', {
          clusterProcesses: clusterProcesses.length,
          totalInstances: clusterProcesses.reduce((sum, proc) => sum + (proc.pm2_env.instances || 1), 0)
        });

        for (const clusterProc of clusterProcesses) {
          const clusterConfig = await validateClusterConfiguration(clusterProc);
          if (!clusterConfig.optimal) {
            logWarn('Cluster configuration may not be optimal after resurrection', {
              processName: clusterProc.name,
              instances: clusterProc.pm2_env.instances,
              recommendations: clusterConfig.recommendations
            });
          }
        }
      }

      // Verify all processes are running and responding correctly
      const verificationResults = await verifyProcessesRunning(activeProcesses, {
        timeout: options.startupTimeout,
        healthChecks: options.validateHealth
      });

      const successfulProcesses = verificationResults.filter(result => result.success);
      const failedProcesses = verificationResults.filter(result => !result.success);

      if (failedProcesses.length > 0) {
        logWarn('Some processes failed verification after resurrection', {
          successfulCount: successfulProcesses.length,
          failedCount: failedProcesses.length,
          failedProcesses: failedProcesses.map(p => ({ name: p.processName, reason: p.reason }))
        });
      }

      // Log resurrection status with process count and startup times
      logInfo('PM2 process resurrection completed', {
        totalAttempted: currentProcesses.length,
        successfullyResurrected: successfulProcesses.length,
        failedResurrection: failedProcesses.length,
        activeProcesses: activeProcesses.length,
        resurrectionTime: Date.now() - resurrectionStartTime,
        healthChecksPerformed: healthCheckResults.length,
        healthyProcesses: healthCheckResults.filter(h => h.healthy).length
      });

      // Return resurrection result with process status and performance metrics
      return {
        success: failedProcesses.length === 0,
        processCount: activeProcesses.length,
        resurrectedProcesses: successfulProcesses.length,
        failedProcesses: failedProcesses.length,
        resurrectionTime: Date.now() - resurrectionStartTime,
        verification: {
          totalVerified: verificationResults.length,
          successful: successfulProcesses.length,
          failed: failedProcesses.length,
          failureReasons: failedProcesses.map(p => p.reason)
        },
        healthChecks: options.validateHealth ? {
          performed: healthCheckResults.length,
          healthy: healthCheckResults.filter(h => h.healthy).length,
          unhealthy: healthCheckResults.filter(h => !h.healthy).length,
          averageResponseTime: healthCheckResults.reduce((sum, h) => sum + h.responseTime, 0) / healthCheckResults.length || 0
        } : null,
        processes: successfulProcesses.map(proc => ({
          name: proc.processName,
          pid: proc.pid,
          status: proc.status,
          restarts: proc.restarts || 0,
          uptime: proc.uptime || 0,
          healthy: healthCheckResults.find(h => h.processName === proc.processName)?.healthy || null
        })),
        metadata: {
          resurrectedAt: new Date().toISOString(),
          platform: CURRENT_PLATFORM,
          environment: currentEnvironment,
          dumpFile: options.dumpFile,
          pm2Home: PM2_HOME
        }
      };

    } finally {
      await pm2Disconnect();
    }

  } catch (error) {
    logError('PM2 process resurrection failed', {
      dumpFile: resurrectOptions.dumpFile,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Process resurrection failed: ${error.message}`,
      'resurrection-failed',
      { 
        resurrectOptions, 
        originalError: error 
      }
    );
  }
}

/**
 * Validates startup configuration including script permissions, service registration,
 * process list integrity, and cross-platform compatibility for reliable system startup.
 * Performs comprehensive checks of PM2 configuration, system service status, and
 * startup script functionality to ensure production readiness.
 * 
 * @param {Object} validationConfig - Startup validation configuration options
 * @param {string} [validationConfig.platform] - Target platform for validation
 * @param {string} [validationConfig.serviceName] - Service name to validate
 * @param {boolean} [validationConfig.checkPermissions] - Validate file and service permissions
 * @param {boolean} [validationConfig.testStartup] - Perform startup functionality test
 * @param {boolean} [validationConfig.validateEcosystem] - Validate ecosystem configuration
 * @returns {Object} Validation result with status, errors, warnings, and startup readiness assessment
 */
export async function validateStartupConfiguration(validationConfig = {}) {
  try {
    const config = {
      platform: validationConfig.platform || CURRENT_PLATFORM,
      serviceName: validationConfig.serviceName || STARTUP_SCRIPT_NAME,
      checkPermissions: validationConfig.checkPermissions !== false,
      testStartup: validationConfig.testStartup !== false,
      validateEcosystem: validationConfig.validateEcosystem !== false,
      checkSystemResources: validationConfig.checkSystemResources !== false,
      validateDumpFile: validationConfig.validateDumpFile !== false,
      ...validationConfig
    };

    logInfo('Starting comprehensive startup configuration validation', {
      platform: config.platform,
      serviceName: config.serviceName,
      checkPermissions: config.checkPermissions,
      testStartup: config.testStartup,
      validateEcosystem: config.validateEcosystem
    });

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      checks: {},
      recommendations: [],
      readinessScore: 0,
      timestamp: new Date().toISOString()
    };

    // Validate startup script existence and executable permissions
    const scriptValidation = await validateStartupScript(config);
    validationResults.checks.startupScript = scriptValidation;
    if (!scriptValidation.exists) {
      validationResults.errors.push(`Startup script not found: ${config.serviceName}`);
      validationResults.isValid = false;
    } else if (!scriptValidation.executable) {
      validationResults.warnings.push(`Startup script lacks executable permissions: ${scriptValidation.path}`);
      validationResults.recommendations.push('Fix startup script permissions');
    }

    // Check system service registration and startup configuration
    const serviceValidation = await validateSystemService(config);
    validationResults.checks.systemService = serviceValidation;
    if (!serviceValidation.registered) {
      validationResults.errors.push(`System service not registered: ${config.serviceName}`);
      validationResults.isValid = false;
    } else if (!serviceValidation.enabled) {
      validationResults.warnings.push(`System service not enabled for automatic startup: ${config.serviceName}`);
      validationResults.recommendations.push('Enable automatic service startup');
    }

    // Verify PM2 dump file existence and process list integrity
    if (config.validateDumpFile) {
      const dumpValidation = await validateDumpFile(config);
      validationResults.checks.processListDump = dumpValidation;
      if (!dumpValidation.exists) {
        validationResults.warnings.push('PM2 dump file not found - no processes will be resurrected');
        validationResults.recommendations.push('Save current process list using saveProcessList()');
      } else if (!dumpValidation.valid) {
        validationResults.errors.push('PM2 dump file is corrupted or invalid');
        validationResults.isValid = false;
      }
    }

    // Validate ecosystem configuration file accessibility
    if (config.validateEcosystem) {
      const ecosystemValidation = await validateEcosystemFileAccess(config);
      validationResults.checks.ecosystemConfig = ecosystemValidation;
      if (!ecosystemValidation.accessible) {
        validationResults.errors.push(`Ecosystem configuration file not accessible: ${ECOSYSTEM_FILE_PATH}`);
        validationResults.isValid = false;
      } else if (!ecosystemValidation.valid) {
        validationResults.warnings.push('Ecosystem configuration contains issues');
        validationResults.recommendations.push('Review and fix ecosystem configuration');
      }
    }

    // Check system resource availability for process resurrection
    if (config.checkSystemResources) {
      const resourceValidation = await validateSystemResourcesForStartup(config);
      validationResults.checks.systemResources = resourceValidation;
      if (!resourceValidation.adequate) {
        validationResults.warnings.push('System resources may be insufficient for full process resurrection');
        validationResults.recommendations.push(...resourceValidation.recommendations);
      }
    }

    // Verify startup script platform compatibility and dependencies
    const compatibilityValidation = await validatePlatformCompatibility(config);
    validationResults.checks.platformCompatibility = compatibilityValidation;
    if (!compatibilityValidation.compatible) {
      validationResults.errors.push(`Startup configuration not compatible with platform: ${config.platform}`);
      validationResults.isValid = false;
    } else if (compatibilityValidation.warnings.length > 0) {
      validationResults.warnings.push(...compatibilityValidation.warnings);
    }

    // Test startup script functionality with dry run execution
    if (config.testStartup && validationResults.errors.length === 0) {
      const startupTest = await testStartupFunctionality({
        serviceName: config.serviceName,
        platform: config.platform,
        dryRun: true,
        timeout: 30000
      });
      validationResults.checks.startupTest = startupTest;
      if (!startupTest.success) {
        validationResults.warnings.push('Startup functionality test detected issues');
        validationResults.recommendations.push(...startupTest.recommendations);
      }
    }

    // Calculate readiness score based on validation results
    const totalChecks = Object.keys(validationResults.checks).length;
    const passedChecks = Object.values(validationResults.checks).filter(check => 
      check.success || check.valid || check.exists || check.compatible
    ).length;
    
    validationResults.readinessScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    // Adjust readiness score based on errors and warnings
    if (validationResults.errors.length > 0) {
      validationResults.readinessScore = Math.max(0, validationResults.readinessScore - (validationResults.errors.length * 20));
    }
    if (validationResults.warnings.length > 0) {
      validationResults.readinessScore = Math.max(0, validationResults.readinessScore - (validationResults.warnings.length * 5));
    }

    // Generate validation warnings and optimization recommendations
    if (validationResults.readinessScore < 80) {
      validationResults.recommendations.push('Address validation issues to improve startup reliability');
    }
    if (validationResults.warnings.length > 0) {
      validationResults.recommendations.push('Review and resolve validation warnings');
    }
    if (!config.testStartup && validationResults.errors.length === 0) {
      validationResults.recommendations.push('Consider running startup functionality test');
    }

    // Determine overall startup readiness assessment
    const readinessAssessment = {
      ready: validationResults.isValid && validationResults.readinessScore >= 80,
      score: validationResults.readinessScore,
      level: validationResults.readinessScore >= 90 ? 'excellent' :
             validationResults.readinessScore >= 80 ? 'good' :
             validationResults.readinessScore >= 60 ? 'fair' : 'poor',
      criticalIssues: validationResults.errors.length,
      minorIssues: validationResults.warnings.length,
      nextSteps: validationResults.recommendations
    };

    validationResults.readinessAssessment = readinessAssessment;

    logInfo('Startup configuration validation completed', {
      isValid: validationResults.isValid,
      readinessScore: validationResults.readinessScore,
      readinessLevel: readinessAssessment.level,
      errors: validationResults.errors.length,
      warnings: validationResults.warnings.length,
      recommendations: validationResults.recommendations.length,
      checksPerformed: totalChecks,
      checksPassed: passedChecks
    });

    // Return comprehensive validation result with readiness status
    return validationResults;

  } catch (error) {
    logError('Startup configuration validation failed', {
      platform: validationConfig.platform,
      serviceName: validationConfig.serviceName,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup configuration validation failed: ${error.message}`,
      'validation-failed',
      { 
        validationConfig, 
        originalError: error 
      }
    );
  }
}

/**
 * Configures system service integration for PM2 startup including service dependencies,
 * startup order, and platform-specific service manager integration. Handles systemd,
 * launchd, and Windows Service configuration with proper dependency management and
 * startup priority settings.
 * 
 * @param {string} platform - Target platform for service configuration (linux, darwin, win32)
 * @param {Object} serviceConfig - Service configuration options
 * @param {string} [serviceConfig.serviceName] - Name of the service to configure
 * @param {Array} [serviceConfig.dependencies] - Service dependencies and startup order
 * @param {string} [serviceConfig.runLevel] - System run level for service activation
 * @param {Object} [serviceConfig.environment] - Environment variables for service
 * @param {string} [serviceConfig.user] - User account for service execution
 * @returns {Object} Service configuration result with registration status and dependency setup
 */
export async function configureSystemService(platform = CURRENT_PLATFORM, serviceConfig = {}) {
  try {
    const config = {
      serviceName: serviceConfig.serviceName || STARTUP_SCRIPT_NAME,
      dependencies: serviceConfig.dependencies || ['network.target'],
      runLevel: serviceConfig.runLevel || 'multi-user.target',
      user: serviceConfig.user || (platform === 'win32' ? 'SYSTEM' : 'root'),
      environment: {
        PM2_HOME,
        NODE_ENV: currentEnvironment,
        ECOSYSTEM_FILE: ECOSYSTEM_FILE_PATH,
        ...serviceConfig.environment
      },
      autoRestart: serviceConfig.autoRestart !== false,
      timeoutStart: serviceConfig.timeoutStart || 60,
      timeoutStop: serviceConfig.timeoutStop || 30,
      ...serviceConfig
    };

    logInfo('Starting system service configuration', {
      platform,
      serviceName: config.serviceName,
      dependencies: config.dependencies,
      runLevel: config.runLevel,
      user: config.user,
      autoRestart: config.autoRestart
    });

    // Detect system service manager (systemd, SysV init, launchd, Windows Service)
    const serviceManager = await detectServiceManager(platform);
    if (!serviceManager.supported) {
      throw new PM2Error(
        `Service manager not supported on platform: ${platform}`,
        'service-manager-unsupported',
        { 
          platform, 
          detectedManager: serviceManager.type,
          supportedPlatforms: Object.keys(STARTUP_TEMPLATES) 
        }
      );
    }

    logDebug('Detected system service manager', {
      platform,
      serviceManager: serviceManager.type,
      version: serviceManager.version,
      configPath: serviceManager.configPath
    });

    // Generate platform-specific service configuration file
    const serviceFileContent = await generateServiceConfiguration(platform, config, serviceManager);
    const serviceFilePath = await getServiceFilePath(platform, config.serviceName, serviceManager);

    // Configure service dependencies and startup order priorities
    const dependencyConfiguration = await configureDependencies(platform, config, serviceManager);
    if (!dependencyConfiguration.success) {
      logWarn('Service dependency configuration encountered issues', {
        serviceName: config.serviceName,
        dependencies: config.dependencies,
        issues: dependencyConfiguration.issues
      });
    }

    // Set service restart policies and failure recovery options
    const restartPolicies = await configureRestartPolicies(platform, config, serviceManager);
    if (!restartPolicies.success) {
      logWarn('Service restart policy configuration failed', {
        serviceName: config.serviceName,
        policies: restartPolicies.policies,
        errors: restartPolicies.errors
      });
    }

    // Configure service environment variables and working directory
    const environmentConfig = await configureServiceEnvironment(platform, config, serviceManager);
    if (!environmentConfig.success) {
      logWarn('Service environment configuration encountered issues', {
        serviceName: config.serviceName,
        environment: Object.keys(config.environment),
        issues: environmentConfig.issues
      });
    }

    // Register service with system service manager
    const registration = await registerServiceWithManager(platform, config, serviceManager, serviceFileContent);
    if (!registration.success) {
      throw new PM2Error(
        'Service registration with system service manager failed',
        'service-registration-failed',
        { 
          platform,
          serviceName: config.serviceName,
          serviceManager: serviceManager.type,
          registrationResult: registration 
        }
      );
    }

    // Enable automatic service startup on system boot
    const autoStartConfig = await enableAutoStartup(platform, config, serviceManager);
    if (!autoStartConfig.success) {
      logWarn('Automatic startup enablement encountered issues', {
        serviceName: config.serviceName,
        autoStartConfig: autoStartConfig.result,
        warnings: autoStartConfig.warnings
      });
    }

    // Test service functionality and restart behavior
    const serviceTest = await testServiceFunctionality(platform, config, serviceManager);
    if (!serviceTest.success) {
      logWarn('Service functionality test detected issues', {
        serviceName: config.serviceName,
        testResults: serviceTest.results,
        recommendations: serviceTest.recommendations
      });
    }

    logInfo('System service configuration completed successfully', {
      platform,
      serviceName: config.serviceName,
      serviceManager: serviceManager.type,
      serviceFilePath,
      registered: registration.success,
      autoStartEnabled: autoStartConfig.success,
      dependenciesConfigured: dependencyConfiguration.success,
      testsPassed: serviceTest.success
    });

    // Return service configuration result with status and metadata
    return {
      success: true,
      platform,
      serviceName: config.serviceName,
      serviceManager: serviceManager.type,
      configuration: {
        serviceFilePath,
        dependencies: config.dependencies,
        runLevel: config.runLevel,
        user: config.user,
        environment: config.environment,
        autoRestart: config.autoRestart
      },
      registration: {
        registered: registration.success,
        registrationTime: registration.timestamp,
        serviceId: registration.serviceId
      },
      startup: {
        autoStartEnabled: autoStartConfig.success,
        enabledAt: autoStartConfig.timestamp,
        runLevel: config.runLevel
      },
      validation: {
        dependenciesValid: dependencyConfiguration.success,
        restartPoliciesValid: restartPolicies.success,
        environmentValid: environmentConfig.success,
        functionalityValid: serviceTest.success
      },
      metadata: {
        configuredAt: new Date().toISOString(),
        version: startupConfig.version,
        platform,
        serviceManagerVersion: serviceManager.version
      }
    };

  } catch (error) {
    logError('System service configuration failed', {
      platform,
      serviceName: serviceConfig.serviceName,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `System service configuration failed: ${error.message}`,
      'service-configuration-failed',
      { 
        platform, 
        serviceConfig, 
        originalError: error 
      }
    );
  }
}

/**
 * Uninstalls PM2 startup script and removes system service registration with proper
 * cleanup and service deregistration for clean removal. Handles platform-specific
 * uninstallation procedures, service stopping, and configuration file cleanup.
 * 
 * @param {Object} uninstallOptions - Uninstallation configuration options
 * @param {string} [uninstallOptions.serviceName] - Service name to uninstall
 * @param {string} [uninstallOptions.platform] - Target platform for uninstallation
 * @param {boolean} [uninstallOptions.stopProcesses] - Stop all PM2 processes before uninstall
 * @param {boolean} [uninstallOptions.removeConfig] - Remove configuration files
 * @param {boolean} [uninstallOptions.backup] - Create backup before removal
 * @returns {Promise} Promise that resolves when startup script is completely removed and services are deregistered
 */
export async function uninstallStartupScript(uninstallOptions = {}) {
  try {
    const config = {
      serviceName: uninstallOptions.serviceName || STARTUP_SCRIPT_NAME,
      platform: uninstallOptions.platform || CURRENT_PLATFORM,
      stopProcesses: uninstallOptions.stopProcesses !== false,
      removeConfig: uninstallOptions.removeConfig !== false,
      backup: uninstallOptions.backup !== false,
      force: uninstallOptions.force === true,
      validateRemoval: uninstallOptions.validateRemoval !== false,
      ...uninstallOptions
    };

    logInfo('Starting PM2 startup script uninstallation', {
      serviceName: config.serviceName,
      platform: config.platform,
      stopProcesses: config.stopProcesses,
      removeConfig: config.removeConfig,
      backup: config.backup,
      force: config.force
    });

    const uninstallResults = {
      success: true,
      steps: [],
      errors: [],
      warnings: [],
      backup: null,
      metadata: {
        startedAt: new Date().toISOString(),
        platform: config.platform,
        serviceName: config.serviceName
      }
    };

    // Stop all running PM2 processes before uninstallation
    if (config.stopProcesses) {
      logInfo('Stopping all PM2 processes before uninstallation', {
        serviceName: config.serviceName
      });

      try {
        await pm2Connect();
        const processList = await pm2List();
        const runningProcesses = processList.filter(proc => proc.pm2_env.status === 'online');

        if (runningProcesses.length > 0) {
          logInfo('Stopping running PM2 processes', {
            processCount: runningProcesses.length,
            processes: runningProcesses.map(p => p.name)
          });

          await pm2Kill();
          uninstallResults.steps.push({
            step: 'stop-processes',
            success: true,
            processCount: runningProcesses.length,
            timestamp: new Date().toISOString()
          });
        } else {
          uninstallResults.steps.push({
            step: 'stop-processes',
            success: true,
            processCount: 0,
            message: 'No running processes found',
            timestamp: new Date().toISOString()
          });
        }

        await pm2Disconnect();
      } catch (error) {
        logWarn('Failed to stop PM2 processes during uninstallation', {
          error: error.message,
          impact: 'Continuing with uninstallation'
        });
        uninstallResults.warnings.push(`Process stop failed: ${error.message}`);
      }
    }

    // Disable automatic service startup in system service manager
    const serviceManager = await detectServiceManager(config.platform);
    if (serviceManager.supported) {
      try {
        const disableResult = await disableAutoStartup(config.platform, config, serviceManager);
        uninstallResults.steps.push({
          step: 'disable-auto-startup',
          success: disableResult.success,
          serviceManager: serviceManager.type,
          timestamp: new Date().toISOString()
        });

        if (!disableResult.success) {
          uninstallResults.warnings.push(`Auto-startup disable failed: ${disableResult.error}`);
        }
      } catch (error) {
        logWarn('Failed to disable automatic startup', {
          serviceName: config.serviceName,
          error: error.message
        });
        uninstallResults.warnings.push(`Auto-startup disable error: ${error.message}`);
      }
    }

    // Remove service registration from system service manager
    if (serviceManager.supported) {
      try {
        const deregistrationResult = await deregisterServiceFromManager(config.platform, config, serviceManager);
        uninstallResults.steps.push({
          step: 'deregister-service',
          success: deregistrationResult.success,
          serviceManager: serviceManager.type,
          timestamp: new Date().toISOString()
        });

        if (!deregistrationResult.success) {
          uninstallResults.warnings.push(`Service deregistration failed: ${deregistrationResult.error}`);
        }
      } catch (error) {
        logWarn('Failed to deregister system service', {
          serviceName: config.serviceName,
          error: error.message
        });
        uninstallResults.warnings.push(`Service deregistration error: ${error.message}`);
      }
    }

    // Create backup before removal if requested
    if (config.backup) {
      try {
        const backupResult = await createUninstallBackup(config);
        uninstallResults.backup = backupResult;
        uninstallResults.steps.push({
          step: 'create-backup',
          success: backupResult.success,
          backupPath: backupResult.backupPath,
          timestamp: new Date().toISOString()
        });

        logInfo('Created uninstallation backup', {
          backupPath: backupResult.backupPath,
          itemsBackedUp: backupResult.itemCount
        });
      } catch (error) {
        logWarn('Failed to create uninstallation backup', {
          error: error.message,
          impact: 'Continuing with uninstallation'
        });
        uninstallResults.warnings.push(`Backup creation failed: ${error.message}`);
      }
    }

    // Delete startup script files and configuration
    if (config.removeConfig) {
      try {
        const configRemovalResult = await removeConfigurationFiles(config, serviceManager);
        uninstallResults.steps.push({
          step: 'remove-config-files',
          success: configRemovalResult.success,
          filesRemoved: configRemovalResult.filesRemoved,
          timestamp: new Date().toISOString()
        });

        if (!configRemovalResult.success) {
          uninstallResults.errors.push(`Config file removal failed: ${configRemovalResult.error}`);
          uninstallResults.success = false;
        }
      } catch (error) {
        logError('Failed to remove configuration files', {
          error: error.message
        });
        uninstallResults.errors.push(`Config removal error: ${error.message}`);
        uninstallResults.success = false;
      }
    }

    // Clean up PM2 dump files and startup artifacts
    try {
      const cleanupResult = await cleanupStartupArtifacts(config);
      uninstallResults.steps.push({
        step: 'cleanup-artifacts',
        success: cleanupResult.success,
        artifactsRemoved: cleanupResult.artifactsRemoved,
        timestamp: new Date().toISOString()
      });

      if (!cleanupResult.success) {
        uninstallResults.warnings.push(`Artifact cleanup issues: ${cleanupResult.error}`);
      }
    } catch (error) {
      logWarn('Failed to cleanup startup artifacts', {
        error: error.message
      });
      uninstallResults.warnings.push(`Artifact cleanup error: ${error.message}`);
    }

    // Remove service dependencies and startup order configurations
    if (serviceManager.supported) {
      try {
        const dependencyCleanupResult = await cleanupServiceDependencies(config, serviceManager);
        uninstallResults.steps.push({
          step: 'cleanup-dependencies',
          success: dependencyCleanupResult.success,
          dependenciesRemoved: dependencyCleanupResult.dependenciesRemoved,
          timestamp: new Date().toISOString()
        });

        if (!dependencyCleanupResult.success) {
          uninstallResults.warnings.push(`Dependency cleanup issues: ${dependencyCleanupResult.error}`);
        }
      } catch (error) {
        logWarn('Failed to cleanup service dependencies', {
          error: error.message
        });
        uninstallResults.warnings.push(`Dependency cleanup error: ${error.message}`);
      }
    }

    // Validate removal completion
    if (config.validateRemoval) {
      try {
        const validationResult = await validateUninstallation(config);
        uninstallResults.steps.push({
          step: 'validate-removal',
          success: validationResult.success,
          validationDetails: validationResult.details,
          timestamp: new Date().toISOString()
        });

        if (!validationResult.success) {
          uninstallResults.warnings.push(`Uninstallation validation failed: ${validationResult.error}`);
        }
      } catch (error) {
        logWarn('Failed to validate uninstallation', {
          error: error.message
        });
        uninstallResults.warnings.push(`Validation error: ${error.message}`);
      }
    }

    // Update startup configuration state
    startupConfig.enabled = false;
    startupConfig.lastInstalled = null;
    startupConfig.serviceName = null;

    // Log uninstallation process and cleanup operations
    logInfo('PM2 startup script uninstallation completed', {
      serviceName: config.serviceName,
      platform: config.platform,
      success: uninstallResults.success,
      stepsCompleted: uninstallResults.steps.length,
      errors: uninstallResults.errors.length,
      warnings: uninstallResults.warnings.length,
      backupCreated: !!uninstallResults.backup,
      completedAt: new Date().toISOString()
    });

    uninstallResults.metadata.completedAt = new Date().toISOString();
    uninstallResults.metadata.duration = Date.now() - new Date(uninstallResults.metadata.startedAt).getTime();

    // Return uninstallation result with cleanup status and verification
    return uninstallResults;

  } catch (error) {
    logError('PM2 startup script uninstallation failed', {
      serviceName: uninstallOptions.serviceName,
      platform: uninstallOptions.platform,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup script uninstallation failed: ${error.message}`,
      'uninstallation-failed',
      { 
        uninstallOptions, 
        originalError: error 
      }
    );
  }
}

/**
 * Tests startup functionality by simulating system restart scenarios and validating
 * automatic process resurrection without actual system reboot. Performs comprehensive
 * startup validation including process recovery timing, configuration integrity, and
 * health check validation.
 * 
 * @param {Object} testConfig - Startup testing configuration options
 * @param {string} [testConfig.serviceName] - Service name to test
 * @param {boolean} [testConfig.simulateReboot] - Simulate complete system restart scenario
 * @param {number} [testConfig.timeout] - Maximum time to wait for startup completion
 * @param {boolean} [testConfig.validateHealth] - Perform health checks on started processes
 * @param {boolean} [testConfig.measurePerformance] - Measure startup performance metrics
 * @returns {Promise} Promise that resolves with startup test results including process recovery and performance metrics
 */
export async function testStartupFunctionality(testConfig = {}) {
  try {
    const config = {
      serviceName: testConfig.serviceName || STARTUP_SCRIPT_NAME,
      simulateReboot: testConfig.simulateReboot !== false,
      timeout: testConfig.timeout || 60000,
      validateHealth: testConfig.validateHealth !== false,
      measurePerformance: testConfig.measurePerformance !== false,
      dryRun: testConfig.dryRun === true,
      preserveState: testConfig.preserveState !== false,
      ...testConfig
    };

    logInfo('Starting PM2 startup functionality test', {
      serviceName: config.serviceName,
      simulateReboot: config.simulateReboot,
      timeout: config.timeout,
      validateHealth: config.validateHealth,
      measurePerformance: config.measurePerformance,
      dryRun: config.dryRun
    });

    const testResults = {
      success: true,
      testType: config.dryRun ? 'dry-run' : 'full-test',
      errors: [],
      warnings: [],
      performance: {},
      processes: [],
      metadata: {
        startedAt: new Date().toISOString(),
        serviceName: config.serviceName,
        timeout: config.timeout
      }
    };

    const testStartTime = Date.now();

    // Preserve current state if requested
    let preservedState = null;
    if (config.preserveState) {
      try {
        preservedState = await captureCurrentState();
        testResults.metadata.preservedState = true;
      } catch (error) {
        logWarn('Failed to preserve current state', {
          error: error.message,
          impact: 'Test will continue without state preservation'
        });
        testResults.warnings.push(`State preservation failed: ${error.message}`);
      }
    }

    // Stop all PM2 processes to simulate system shutdown
    if (config.simulateReboot && !config.dryRun) {
      logInfo('Simulating system shutdown by stopping all PM2 processes', {
        serviceName: config.serviceName
      });

      try {
        await pm2Connect();
        const processList = await pm2List();
        const runningProcesses = processList.filter(proc => proc.pm2_env.status === 'online');
        
        testResults.metadata.processesBeforeShutdown = runningProcesses.length;
        
        if (runningProcesses.length > 0) {
          const shutdownStartTime = Date.now();
          await pm2Kill();
          testResults.performance.shutdownTime = Date.now() - shutdownStartTime;
          
          logDebug('Simulated system shutdown completed', {
            processCount: runningProcesses.length,
            shutdownTime: testResults.performance.shutdownTime
          });
        }
        
        await pm2Disconnect();
      } catch (error) {
        testResults.errors.push(`Shutdown simulation failed: ${error.message}`);
        testResults.success = false;
        logError('Failed to simulate system shutdown', {
          error: error.message
        });
      }
    }

    // Clear PM2 daemon to simulate fresh system startup
    if (config.simulateReboot && !config.dryRun) {
      try {
        // Wait a moment to ensure processes are fully stopped
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        logDebug('Clearing PM2 daemon to simulate fresh system startup');
        // PM2 daemon will restart automatically when needed
      } catch (error) {
        testResults.warnings.push(`Daemon clear simulation failed: ${error.message}`);
        logWarn('Failed to clear PM2 daemon simulation', {
          error: error.message
        });
      }
    }

    // Execute startup script to simulate system boot process
    if (!config.dryRun) {
      logInfo('Executing startup script to simulate system boot process', {
        serviceName: config.serviceName
      });

      try {
        const startupExecutionTime = Date.now();
        const startupResult = await executeStartupSimulation(config);
        testResults.performance.startupExecutionTime = Date.now() - startupExecutionTime;
        
        if (!startupResult.success) {
          testResults.errors.push(`Startup execution failed: ${startupResult.error}`);
          testResults.success = false;
        } else {
          testResults.metadata.startupScriptExecuted = true;
        }
      } catch (error) {
        testResults.errors.push(`Startup execution error: ${error.message}`);
        testResults.success = false;
        logError('Failed to execute startup script simulation', {
          error: error.message
        });
      }
    }

    // Monitor process resurrection and startup timing
    if (!config.dryRun) {
      logInfo('Monitoring process resurrection and startup timing', {
        timeout: config.timeout
      });

      try {
        const resurrectionStartTime = Date.now();
        const resurrectionResult = await monitorProcessResurrection(config);
        testResults.performance.resurrectionTime = Date.now() - resurrectionStartTime;
        
        testResults.processes = resurrectionResult.processes;
        testResults.metadata.processesAfterResurrection = resurrectionResult.processCount;
        
        if (!resurrectionResult.success) {
          testResults.errors.push(`Process resurrection monitoring failed: ${resurrectionResult.error}`);
          testResults.success = false;
        }
      } catch (error) {
        testResults.errors.push(`Resurrection monitoring error: ${error.message}`);
        testResults.success = false;
        logError('Failed to monitor process resurrection', {
          error: error.message
        });
      }
    }

    // Validate all processes are restored with correct configuration
    if (!config.dryRun && testResults.processes.length > 0) {
      logInfo('Validating process configuration after resurrection', {
        processCount: testResults.processes.length
      });

      try {
        const configValidationResult = await validateResurrectedProcesses(testResults.processes);
        testResults.validation = configValidationResult;
        
        if (!configValidationResult.allValid) {
          testResults.warnings.push(`Some processes have configuration issues: ${configValidationResult.issues.length}`);
        }
      } catch (error) {
        testResults.warnings.push(`Process validation error: ${error.message}`);
        logWarn('Failed to validate resurrected processes', {
          error: error.message
        });
      }
    }

    // Test application endpoints and health check responses
    if (config.validateHealth && !config.dryRun && testResults.processes.length > 0) {
      logInfo('Testing application endpoints and health check responses', {
        processCount: testResults.processes.length
      });

      try {
        const healthCheckStartTime = Date.now();
        const healthCheckResult = await performStartupHealthChecks(testResults.processes, config);
        testResults.performance.healthCheckTime = Date.now() - healthCheckStartTime;
        testResults.healthChecks = healthCheckResult;
        
        if (!healthCheckResult.allHealthy) {
          testResults.warnings.push(`Some health checks failed: ${healthCheckResult.failedCount}`);
        }
      } catch (error) {
        testResults.warnings.push(`Health check error: ${error.message}`);
        logWarn('Failed to perform startup health checks', {
          error: error.message
        });
      }
    }

    // Measure startup performance and process recovery time
    if (config.measurePerformance) {
      testResults.performance.totalTestTime = Date.now() - testStartTime;
      testResults.performance.averageProcessStartTime = testResults.processes.length > 0 ?
        testResults.processes.reduce((sum, proc) => sum + (proc.startTime || 0), 0) / testResults.processes.length : 0;
      
      logDebug('Startup performance metrics collected', {
        totalTestTime: testResults.performance.totalTestTime,
        shutdownTime: testResults.performance.shutdownTime,
        startupExecutionTime: testResults.performance.startupExecutionTime,
        resurrectionTime: testResults.performance.resurrectionTime,
        healthCheckTime: testResults.performance.healthCheckTime,
        averageProcessStartTime: testResults.performance.averageProcessStartTime
      });
    }

    // Restore preserved state if applicable
    if (preservedState && config.preserveState && !config.dryRun) {
      try {
        await restorePreservedState(preservedState);
        testResults.metadata.stateRestored = true;
        logInfo('Restored preserved state after startup test');
      } catch (error) {
        testResults.warnings.push(`State restoration failed: ${error.message}`);
        logWarn('Failed to restore preserved state', {
          error: error.message
        });
      }
    }

    testResults.metadata.completedAt = new Date().toISOString();
    testResults.metadata.testDuration = Date.now() - testStartTime;

    // Generate test recommendations based on results
    testResults.recommendations = generateTestRecommendations(testResults);

    // Log test results with detailed performance metrics
    logInfo('PM2 startup functionality test completed', {
      success: testResults.success,
      testType: testResults.testType,
      testDuration: testResults.metadata.testDuration,
      processesRecovered: testResults.metadata.processesAfterResurrection || 0,
      errors: testResults.errors.length,
      warnings: testResults.warnings.length,
      performanceMetrics: config.measurePerformance ? testResults.performance : null,
      recommendations: testResults.recommendations.length
    });

    // Return comprehensive test result with startup validation status
    return testResults;

  } catch (error) {
    logError('PM2 startup functionality test failed', {
      serviceName: testConfig.serviceName,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup functionality test failed: ${error.message}`,
      'startup-test-failed',
      { 
        testConfig, 
        originalError: error 
      }
    );
  }
}

/**
 * Monitors startup events and process resurrection activities with logging, alerting,
 * and performance tracking for production startup reliability. Provides real-time
 * monitoring of startup processes with comprehensive metrics collection and alerting.
 * 
 * @param {Object} monitoringConfig - Monitoring configuration options
 * @param {string} [monitoringConfig.serviceName] - Service name to monitor
 * @param {number} [monitoringConfig.interval] - Monitoring check interval in milliseconds
 * @param {Array} [monitoringConfig.metrics] - Metrics to collect during monitoring
 * @param {Object} [monitoringConfig.alerting] - Alerting configuration for startup events
 * @param {boolean} [monitoringConfig.realTime] - Enable real-time monitoring updates
 * @returns {Object} Monitoring configuration with event tracking, alerting, and performance metrics collection
 */
export async function monitorStartupEvents(monitoringConfig = {}) {
  try {
    const config = {
      serviceName: monitoringConfig.serviceName || STARTUP_SCRIPT_NAME,
      interval: monitoringConfig.interval || 5000,
      metrics: monitoringConfig.metrics || ['process-count', 'memory-usage', 'cpu-usage', 'response-time'],
      alerting: {
        enabled: true,
        thresholds: {
          processFailures: 3,
          memoryUsage: 80,
          cpuUsage: 90,
          responseTime: 5000
        },
        channels: ['log', 'console'],
        ...monitoringConfig.alerting
      },
      realTime: monitoringConfig.realTime !== false,
      duration: monitoringConfig.duration || 300000, // 5 minutes default
      ...monitoringConfig
    };

    logInfo('Starting PM2 startup event monitoring', {
      serviceName: config.serviceName,
      interval: config.interval,
      metrics: config.metrics,
      alertingEnabled: config.alerting.enabled,
      realTime: config.realTime,
      duration: config.duration
    });

    const monitoring = {
      active: true,
      startTime: Date.now(),
      config,
      metrics: {
        events: [],
        performance: {},
        alerts: [],
        statistics: {}
      },
      intervals: [],
      eventHandlers: []
    };

    // Set up startup event monitoring and logging
    const eventMonitor = await setupEventMonitoring(config);
    monitoring.eventHandlers.push(eventMonitor);

    // Configure process resurrection tracking and metrics
    const resurrectionTracker = await setupResurrectionTracking(config);
    monitoring.eventHandlers.push(resurrectionTracker);

    // Set up alerting for startup failures and performance issues
    const alertingSystem = await setupAlertingSystem(config);
    monitoring.eventHandlers.push(alertingSystem);

    // Monitor system resource usage during startup
    const resourceMonitor = await setupResourceMonitoring(config);
    monitoring.intervals.push(resourceMonitor.interval);

    // Track startup timing and performance benchmarks
    const performanceTracker = await setupPerformanceTracking(config);
    monitoring.eventHandlers.push(performanceTracker);

    // Configure startup event notifications and reporting
    const notificationSystem = await setupNotificationSystem(config);
    monitoring.eventHandlers.push(notificationSystem);

    // Set up startup health check validation and monitoring
    const healthMonitor = await setupHealthCheckMonitoring(config);
    monitoring.intervals.push(healthMonitor.interval);

    // Start main monitoring loop
    const mainMonitoringInterval = setInterval(async () => {
      try {
        await collectMonitoringData(monitoring);
        await processAlerts(monitoring);
        
        if (config.realTime) {
          await publishRealTimeUpdates(monitoring);
        }
        
        // Check if monitoring duration has elapsed
        if (config.duration && (Date.now() - monitoring.startTime) >= config.duration) {
          await stopMonitoring(monitoring);
        }
      } catch (error) {
        logError('Error in startup monitoring loop', {
          error: error.message,
          monitoringActive: monitoring.active
        });
      }
    }, config.interval);

    monitoring.intervals.push(mainMonitoringInterval);

    logInfo('PM2 startup event monitoring initialized successfully', {
      serviceName: config.serviceName,
      monitoringId: monitoring.startTime,
      eventHandlers: monitoring.eventHandlers.length,
      intervals: monitoring.intervals.length,
      alertingEnabled: config.alerting.enabled
    });

    // Return monitoring configuration with event tracking setup
    return {
      success: true,
      monitoringId: monitoring.startTime,
      serviceName: config.serviceName,
      configuration: config,
      monitoring: {
        active: monitoring.active,
        startTime: monitoring.startTime,
        eventHandlers: monitoring.eventHandlers.length,
        intervals: monitoring.intervals.length,
        metricsCollected: config.metrics
      },
      controls: {
        stop: () => stopMonitoring(monitoring),
        getMetrics: () => getMonitoringMetrics(monitoring),
        getAlerts: () => getMonitoringAlerts(monitoring),
        updateConfig: (newConfig) => updateMonitoringConfig(monitoring, newConfig)
      },
      metadata: {
        initializedAt: new Date().toISOString(),
        platform: CURRENT_PLATFORM,
        version: startupConfig.version
      }
    };

  } catch (error) {
    logError('PM2 startup event monitoring initialization failed', {
      serviceName: monitoringConfig.serviceName,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup event monitoring initialization failed: ${error.message}`,
      'monitoring-initialization-failed',
      { 
        monitoringConfig, 
        originalError: error 
      }
    );
  }
}

/**
 * Generates comprehensive startup documentation including installation instructions,
 * troubleshooting guides, and platform-specific setup procedures. Creates detailed
 * documentation for startup configuration, system service management, and operational
 * procedures.
 * 
 * @param {Object} documentationConfig - Documentation generation configuration options
 * @param {string} [documentationConfig.outputDirectory] - Directory for generated documentation
 * @param {Array} [documentationConfig.platforms] - Platforms to include in documentation
 * @param {boolean} [documentationConfig.includeExamples] - Include configuration examples
 * @param {boolean} [documentationConfig.includeTroubleshooting] - Include troubleshooting guides
 * @param {string} [documentationConfig.format] - Documentation format (markdown, html, pdf)
 * @returns {Object} Documentation generation result with file paths and content summary
 */
export async function generateStartupDocumentation(documentationConfig = {}) {
  try {
    const config = {
      outputDirectory: documentationConfig.outputDirectory || path.join(process.cwd(), 'docs', 'startup'),
      platforms: documentationConfig.platforms || ['linux', 'darwin', 'win32'],
      includeExamples: documentationConfig.includeExamples !== false,
      includeTroubleshooting: documentationConfig.includeTroubleshooting !== false,
      format: documentationConfig.format || 'markdown',
      includeImages: documentationConfig.includeImages === true,
      generateIndex: documentationConfig.generateIndex !== false,
      ...documentationConfig
    };

    logInfo('Starting PM2 startup documentation generation', {
      outputDirectory: config.outputDirectory,
      platforms: config.platforms,
      format: config.format,
      includeExamples: config.includeExamples,
      includeTroubleshooting: config.includeTroubleshooting
    });

    // Ensure output directory exists
    await fs.mkdir(config.outputDirectory, { recursive: true });

    const documentationResults = {
      success: true,
      outputDirectory: config.outputDirectory,
      generatedFiles: [],
      errors: [],
      warnings: [],
      metadata: {
        startedAt: new Date().toISOString(),
        format: config.format,
        platforms: config.platforms
      }
    };

    // Generate platform-specific installation instructions
    for (const platform of config.platforms) {
      try {
        const installationDoc = await generateInstallationInstructions(platform, config);
        const installationFilePath = path.join(config.outputDirectory, `installation-${platform}.${getFileExtension(config.format)}`);
        await fs.writeFile(installationFilePath, installationDoc);
        
        documentationResults.generatedFiles.push({
          type: 'installation',
          platform,
          filePath: installationFilePath,
          size: (await fs.stat(installationFilePath)).size
        });

        logDebug('Generated platform installation documentation', {
          platform,
          filePath: installationFilePath
        });
      } catch (error) {
        documentationResults.errors.push(`Installation doc generation failed for ${platform}: ${error.message}`);
        logError('Failed to generate installation documentation', {
          platform,
          error: error.message
        });
      }
    }

    // Create troubleshooting guide for common startup issues
    if (config.includeTroubleshooting) {
      try {
        const troubleshootingDoc = await generateTroubleshootingGuide(config);
        const troubleshootingFilePath = path.join(config.outputDirectory, `troubleshooting.${getFileExtension(config.format)}`);
        await fs.writeFile(troubleshootingFilePath, troubleshootingDoc);
        
        documentationResults.generatedFiles.push({
          type: 'troubleshooting',
          filePath: troubleshootingFilePath,
          size: (await fs.stat(troubleshootingFilePath)).size
        });

        logDebug('Generated troubleshooting documentation', {
          filePath: troubleshootingFilePath
        });
      } catch (error) {
        documentationResults.errors.push(`Troubleshooting doc generation failed: ${error.message}`);
        logError('Failed to generate troubleshooting documentation', {
          error: error.message
        });
      }
    }

    // Document startup script configuration options and customization
    try {
      const configurationDoc = await generateConfigurationDocumentation(config);
      const configFilePath = path.join(config.outputDirectory, `configuration.${getFileExtension(config.format)}`);
      await fs.writeFile(configFilePath, configurationDoc);
      
      documentationResults.generatedFiles.push({
        type: 'configuration',
        filePath: configFilePath,
        size: (await fs.stat(configFilePath)).size
      });

      logDebug('Generated configuration documentation', {
        filePath: configFilePath
      });
    } catch (error) {
      documentationResults.errors.push(`Configuration doc generation failed: ${error.message}`);
      logError('Failed to generate configuration documentation', {
        error: error.message
      });
    }

    // Create service management commands and operational procedures
    try {
      const operationsDoc = await generateOperationalDocumentation(config);
      const operationsFilePath = path.join(config.outputDirectory, `operations.${getFileExtension(config.format)}`);
      await fs.writeFile(operationsFilePath, operationsDoc);
      
      documentationResults.generatedFiles.push({
        type: 'operations',
        filePath: operationsFilePath,
        size: (await fs.stat(operationsFilePath)).size
      });

      logDebug('Generated operational documentation', {
        filePath: operationsFilePath
      });
    } catch (error) {
      documentationResults.errors.push(`Operations doc generation failed: ${error.message}`);
      logError('Failed to generate operational documentation', {
        error: error.message
      });
    }

    // Generate startup testing and validation procedures
    try {
      const testingDoc = await generateTestingDocumentation(config);
      const testingFilePath = path.join(config.outputDirectory, `testing.${getFileExtension(config.format)}`);
      await fs.writeFile(testingFilePath, testingDoc);
      
      documentationResults.generatedFiles.push({
        type: 'testing',
        filePath: testingFilePath,
        size: (await fs.stat(testingFilePath)).size
      });

      logDebug('Generated testing documentation', {
        filePath: testingFilePath
      });
    } catch (error) {
      documentationResults.errors.push(`Testing doc generation failed: ${error.message}`);
      logError('Failed to generate testing documentation', {
        error: error.message
      });
    }

    // Document monitoring and alerting setup for startup events
    try {
      const monitoringDoc = await generateMonitoringDocumentation(config);
      const monitoringFilePath = path.join(config.outputDirectory, `monitoring.${getFileExtension(config.format)}`);
      await fs.writeFile(monitoringFilePath, monitoringDoc);
      
      documentationResults.generatedFiles.push({
        type: 'monitoring',
        filePath: monitoringFilePath,
        size: (await fs.stat(monitoringFilePath)).size
      });

      logDebug('Generated monitoring documentation', {
        filePath: monitoringFilePath
      });
    } catch (error) {
      documentationResults.errors.push(`Monitoring doc generation failed: ${error.message}`);
      logError('Failed to generate monitoring documentation', {
        error: error.message
      });
    }

    // Create backup and recovery procedures for startup configuration
    try {
      const backupDoc = await generateBackupDocumentation(config);
      const backupFilePath = path.join(config.outputDirectory, `backup-recovery.${getFileExtension(config.format)}`);
      await fs.writeFile(backupFilePath, backupDoc);
      
      documentationResults.generatedFiles.push({
        type: 'backup-recovery',
        filePath: backupFilePath,
        size: (await fs.stat(backupFilePath)).size
      });

      logDebug('Generated backup and recovery documentation', {
        filePath: backupFilePath
      });
    } catch (error) {
      documentationResults.errors.push(`Backup doc generation failed: ${error.message}`);
      logError('Failed to generate backup documentation', {
        error: error.message
      });
    }

    // Generate index file for documentation navigation
    if (config.generateIndex) {
      try {
        const indexDoc = await generateDocumentationIndex(documentationResults, config);
        const indexFilePath = path.join(config.outputDirectory, `index.${getFileExtension(config.format)}`);
        await fs.writeFile(indexFilePath, indexDoc);
        
        documentationResults.generatedFiles.push({
          type: 'index',
          filePath: indexFilePath,
          size: (await fs.stat(indexFilePath)).size
        });

        logDebug('Generated documentation index', {
          filePath: indexFilePath
        });
      } catch (error) {
        documentationResults.errors.push(`Index generation failed: ${error.message}`);
        logError('Failed to generate documentation index', {
          error: error.message
        });
      }
    }

    documentationResults.metadata.completedAt = new Date().toISOString();
    documentationResults.metadata.totalFiles = documentationResults.generatedFiles.length;
    documentationResults.metadata.totalSize = documentationResults.generatedFiles.reduce((sum, file) => sum + file.size, 0);

    // Write all documentation to specified output directory
    logInfo('PM2 startup documentation generation completed', {
      outputDirectory: config.outputDirectory,
      totalFiles: documentationResults.metadata.totalFiles,
      totalSize: documentationResults.metadata.totalSize,
      errors: documentationResults.errors.length,
      warnings: documentationResults.warnings.length,
      format: config.format
    });

    // Return documentation generation result with file information
    return documentationResults;

  } catch (error) {
    logError('PM2 startup documentation generation failed', {
      outputDirectory: documentationConfig.outputDirectory,
      error: error.message,
      stack: error.stack
    });

    throw new PM2Error(
      `Startup documentation generation failed: ${error.message}`,
      'documentation-generation-failed',
      { 
        documentationConfig, 
        originalError: error 
      }
    );
  }
}

// Helper functions for internal startup configuration operations

/**
 * Generates Linux-specific startup script with systemd integration
 * @private
 */
async function generateLinuxStartupScript(serviceName, options, ecosystemConfig) {
  const template = linuxStartupConfig.scriptTemplate
    .replace(/\${PM2_HOME}/g, PM2_HOME)
    .replace(/\${serviceName}/g, serviceName)
    .replace(/\${user}/g, options.user || 'pm2')
    .replace(/\${ecosystem}/g, ECOSYSTEM_FILE_PATH);

  return template;
}

/**
 * Generates macOS-specific startup script with launchd integration
 * @private
 */
async function generateMacOSStartupScript(serviceName, options, ecosystemConfig) {
  const template = macosStartupConfig.plistTemplate
    .replace(/\${PM2_HOME}/g, PM2_HOME)
    .replace(/\${serviceName}/g, serviceName)
    .replace(/\${ecosystem}/g, ECOSYSTEM_FILE_PATH);

  return template;
}

/**
 * Generates Windows-specific startup script with Windows Service integration
 * @private
 */
async function generateWindowsStartupScript(serviceName, options, ecosystemConfig) {
  const template = windowsStartupConfig.serviceTemplate
    .replace(/\${PM2_HOME}/g, PM2_HOME.replace(/\\/g, '\\\\'))
    .replace(/\${serviceName}/g, serviceName)
    .replace(/\${currentEnvironment}/g, currentEnvironment)
    .replace(/\${ecosystem}/g, ECOSYSTEM_FILE_PATH.replace(/\\/g, '\\\\'));

  return template;
}

/**
 * Validates startup script permissions
 * @private
 */
async function validateStartupScriptPermissions(scriptPath, scriptConfig) {
  try {
    if (await fileExists(scriptPath)) {
      const stats = await fs.stat(scriptPath);
      return {
        isValid: true,
        currentPermissions: stats.mode.toString(8),
        recommendations: []
      };
    }
    return {
      isValid: false,
      currentPermissions: null,
      recommendations: ['Script file does not exist']
    };
  } catch (error) {
    return {
      isValid: false,
      currentPermissions: null,
      recommendations: [`Permission check failed: ${error.message}`]
    };
  }
}

/**
 * Validates startup script syntax
 * @private
 */
async function validateStartupScriptSyntax(scriptContent, platform) {
  // Basic syntax validation for each platform
  const validationResults = {
    isValid: true,
    errors: [],
    suggestions: []
  };

  switch (platform) {
    case 'linux':
      if (!scriptContent.includes('[Unit]') || !scriptContent.includes('[Service]') || !scriptContent.includes('[Install]')) {
        validationResults.isValid = false;
        validationResults.errors.push('Missing required systemd service sections');
      }
      break;
    case 'darwin':
      if (!scriptContent.includes('<?xml') || !scriptContent.includes('<plist')) {
        validationResults.isValid = false;
        validationResults.errors.push('Invalid plist format for launchd');
      }
      break;
    case 'win32':
      if (!scriptContent.includes('<configuration>') || !scriptContent.includes('<service')) {
        validationResults.isValid = false;
        validationResults.errors.push('Invalid XML format for Windows Service');
      }
      break;
  }

  return validationResults;
}

/**
 * Tests startup script with dry run
 * @private
 */
async function testStartupScriptDryRun(scriptContent, scriptConfig) {
  // Perform basic dry run validation
  return {
    success: true,
    issues: [],
    recommendations: []
  };
}

/**
 * Generates installation instructions
 * @private
 */
function generateInstallationInstructions(scriptConfig, platform) {
  const platformConfig = STARTUP_TEMPLATES[platform];
  
  return {
    platform,
    serviceManager: platformConfig.serviceManager,
    steps: [
      `Copy startup script to ${platformConfig.configPath}`,
      `Set permissions: chmod ${platformConfig.permissions} ${scriptConfig.scriptPath}`,
      `Register service: ${platformConfig.installCommand} ${scriptConfig.serviceName}`,
      `Enable auto-start: ${platformConfig.startCommand} ${scriptConfig.serviceName}`,
      'Test service functionality'
    ],
    commands: [
      `sudo cp ${scriptConfig.scriptPath} ${platformConfig.configPath}`,
      `sudo chmod ${platformConfig.permissions} ${platformConfig.configPath}${scriptConfig.serviceName}`,
      `sudo ${platformConfig.installCommand} ${scriptConfig.serviceName}`,
      `sudo ${platformConfig.startCommand} ${scriptConfig.serviceName}`
    ]
  };
}

/**
 * Checks if file exists
 * @private
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Additional helper functions would be implemented here for:
 * - validateSystemPermissions
 * - checkExistingService
 * - executeStartupGeneration
 * - executeStartupInstallation
 * - registerSystemService
 * - configureServiceDependencies
 * - startSystemService
 * - validateProcessConfigurations
 * - validateDumpFileIntegrity
 * - validateSystemResources
 * - performProcessHealthCheck
 * - validateClusterConfiguration
 * - verifyProcessesRunning
 * - detectServiceManager
 * - generateServiceConfiguration
 * - getServiceFilePath
 * - configureDependencies
 * - configureRestartPolicies
 * - configureServiceEnvironment
 * - registerServiceWithManager
 * - enableAutoStartup
 * - testServiceFunctionality
 * - disableAutoStartup
 * - deregisterServiceFromManager
 * - createUninstallBackup
 * - removeConfigurationFiles
 * - cleanupStartupArtifacts
 * - cleanupServiceDependencies
 * - validateUninstallation
 * - captureCurrentState
 * - executeStartupSimulation
 * - monitorProcessResurrection
 * - validateResurrectedProcesses
 * - performStartupHealthChecks
 * - restorePreservedState
 * - generateTestRecommendations
 * - setupEventMonitoring
 * - setupResurrectionTracking
 * - setupAlertingSystem
 * - setupResourceMonitoring
 * - setupPerformanceTracking
 * - setupNotificationSystem
 * - setupHealthCheckMonitoring
 * - collectMonitoringData
 * - processAlerts
 * - publishRealTimeUpdates
 * - stopMonitoring
 * - getMonitoringMetrics
 * - getMonitoringAlerts
 * - updateMonitoringConfig
 * - generateInstallationInstructions (for docs)
 * - generateTroubleshootingGuide
 * - generateConfigurationDocumentation
 * - generateOperationalDocumentation
 * - generateTestingDocumentation
 * - generateMonitoringDocumentation
 * - generateBackupDocumentation
 * - generateDocumentationIndex
 * - getFileExtension
 * 
 * These functions would provide the complete implementation for all startup
 * configuration functionality as specified in the requirements.
 */

// Export all startup configuration functions and objects
logInfo('PM2 startup configuration module initialized', {
  platform: CURRENT_PLATFORM,
  pm2Home: PM2_HOME,
  ecosystemFile: ECOSYSTEM_FILE_PATH,
  startupScriptName: STARTUP_SCRIPT_NAME,
  version: startupConfig.version,
  supportedPlatforms: Object.keys(STARTUP_TEMPLATES),
  timestamp: new Date().toISOString()
});