// Keyboard shortcuts for the AI Prompt Manager

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-prompt-manager") {
    // For now, just log that the command was received
    // In a full extension, this would open the popup or perform an action
    console.log("Toggle Prompt Manager shortcut triggered");
  }
});
