/**
 * KORE Tool Route Registry
 *
 * Mapping von ToolDefinition.key → Dashboard-Route.
 * Wenn ein neues Tool ein Dashboard-UI bekommt, wird hier der
 * Eintrag hinzugefügt — das reicht, damit es in der ToolsOverviewPage
 * automatisch klickbar wird.
 */
export const TOOL_ROUTES: Record<string, string> = {
  'standards.excellence_tracker': '/tools/sea',
};

/**
 * Gibt die Dashboard-Route für ein Tool zurück, falls vorhanden.
 */
export function getToolRoute(toolKey: string): string | undefined {
  return TOOL_ROUTES[toolKey];
}
