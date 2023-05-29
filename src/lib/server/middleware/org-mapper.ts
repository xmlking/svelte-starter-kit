import envPub from '$lib/variables/variables';

export function getOrg(subject: string | null | undefined) {
	// TODO: define mapping rules from subject to organization
	let org = envPub.PUBLIC_ORGANIZATION;
	if (subject?.includes('gmail.com')) org = 'chinthagunta';
	return org;
}
