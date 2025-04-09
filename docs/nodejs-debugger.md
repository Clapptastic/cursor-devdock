# Node.js Debugger Service

The Node.js Debugger Service provides advanced debugging capabilities for your Node.js applications, integrated seamlessly into the Cursor DevDock environment.

## Features

- **Real-time Debugging**: Connect to running Node.js processes and debug them in real-time
- **Breakpoint Management**: Set, view, and manage breakpoints in your code
- **Variable Inspection**: Examine local and global variables at any point during execution
- **Execution Control**: Step through code execution with precise control
- **Console Output**: View console.log output and error messages
- **Code Evaluation**: Execute arbitrary JavaScript code in the context of your running application

## Using the Node.js Debugger

### Getting Started

1. Start your Node.js application with the `--inspect` flag:
   ```bash
   node --inspect your-script.js
   ```
   
2. Open the Node.js Debugger UI at http://localhost:10008
3. Click the "Connect to Node.js Process" button to connect to your running application

### Working with Breakpoints

1. Enter the file path and line number in the breakpoint form
2. Click "Add Breakpoint" to set a breakpoint
3. Use the "Remove" button next to a breakpoint to delete it
4. Execution will pause whenever a breakpoint is hit

### Execution Control

Use the following buttons to control code execution:

- **Continue**: Resume execution until the next breakpoint
- **Step Over**: Execute the current line and move to the next line
- **Step Into**: Step into function calls on the current line
- **Step Out**: Complete the current function and return to the caller

### Inspecting Variables

1. When execution is paused, click "Local Variables" to view variables in the current scope
2. Click "Global Variables" to view global variables
3. All variables are displayed with their names and values

### Executing Code

1. Enter JavaScript code in the execution input area
2. Click "Execute" to run the code in the context of the debugging session
3. Results and console output will appear in the Console Output panel

## Advanced Usage

### Debugging Remote Applications

To debug a Node.js application running on a different machine:

1. Start your Node.js application with `--inspect=0.0.0.0:9229` to allow remote connections
2. Ensure port 9229 is accessible from the machine running the debugger
3. Connect to the remote Node.js process using the debugger UI

### Debugging in Docker

When using the Node.js Debugger with containerized applications:

1. Expose port 9229 in your Docker configuration
2. Start your Node.js application with `--inspect=0.0.0.0:9229`
3. Connect to the debugger using the host machine's address

## Integration with Cursor DevDock

The Node.js Debugger integrates with other Cursor DevDock services:

1. **Dashboard**: Access the debugger directly from the main dashboard
2. **Task Master**: Create debugging tasks and track progress
3. **Debug Visualizer**: Visualize complex data structures during debugging

## Troubleshooting

### Connection Issues

If you can't connect to your Node.js process:

1. Ensure your application is running with the `--inspect` flag
2. Check that port 9229 is not blocked by a firewall
3. Verify there are no other debuggers already connected

### Breakpoints Not Triggering

If breakpoints are not being hit:

1. Verify the file path is correct (absolute paths work best)
2. Check that source maps are properly configured if using transpiled code
3. Reconnect the debugger and set the breakpoints again

## Best Practices

1. **Use Source Maps**: When debugging transpiled code, ensure source maps are enabled
2. **Set Strategic Breakpoints**: Place breakpoints at critical decision points in your code
3. **Examine Call Stack**: Use the call stack to understand how execution reached a particular point
4. **Use Conditional Breakpoints**: For complex debugging scenarios, use conditional logic in your breakpoints 