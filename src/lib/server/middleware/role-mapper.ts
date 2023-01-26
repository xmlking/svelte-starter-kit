/**
 * Map IAM Groups/Roles to App Roles
 * AppRole can be temporarily or permanently applied to a user to give the user bulk permissions for a task.
 * Note: if you get CHUNKING_SESSION_COOKIE (session cookie exceeds allowed 4096 bytes) error,
 * reduce number of app roles returned.
 */
export function appRoles(groups: string[]) {
	// TODO: map groups/roles to subset of ['viewer', 'editor', 'moderator', 'supervisor'] app roles
	// console.debug('appRoles: got groups--->', groups);
	return groups ? ['viewer', 'editor', 'moderator'] : ['viewer', 'editor'];
}
