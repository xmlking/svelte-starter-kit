export const limits = [
	{ value: '5', name: '5' },
	{ value: '10', name: '10' },
	{ value: '20', name: '20' },
	{ value: '50', name: '50' },
	{ value: '100', name: '100' }
];

export const rows = [
	{ value: 5, name: '5' },
	{ value: 10, name: '10' },
	{ value: 20, name: '20' },
	{ value: 50, name: '50' },
	{ value: 100, name: '100' }
];

export const subjectTypeOptions = [
	{ value: '', name: 'All' },
	{ value: 'subject_type_user', name: 'User' },
	{ value: 'subject_type_group', name: 'Group' },
	{ value: 'subject_type_service_account', name: 'Service' },
	{ value: 'subject_type_device', name: 'Device' },
	{ value: 'subject_type_device_pool', name: 'Device Pool' }
];

export const subjectTypeOptions2 = [
	{
		value: 'subject_type_user',
		label: 'User'
	},
	{
		value: 'subject_type_group',
		label: 'Group'
	},
	{
		value: 'subject_type_device',
		label: 'Device'
	},
	{
		value: 'subject_type_device_pool',
		label: 'Device Pool'
	}
];

export const protocols = [
	{ value: 'Any', name: 'Any' },
	{ value: 'IP', name: 'IP' },
	{ value: 'ICMP', name: 'ICMP' },
	{ value: 'IGMP', name: 'IGMP' },
	{ value: 'TCP', name: 'TCP' },
	{ value: 'UDP', name: 'UDP' },
	{ value: 'IPV6', name: 'IPV6' },
	{ value: 'ICMPV6', name: 'ICMPV6' },
	{ value: 'RM', name: 'RM' }
];

export const actionOptions = [
	{
		value: 'action_permit',
		label: 'Allow'
	},
	{
		value: 'action_block',
		label: 'Deny'
	}
];

export const directionOptions = [
	{
		value: 'direction_egress',
		label: 'Egress' // Outbound
	},
	{
		value: 'direction_ingress',
		label: 'Ingress' // Inbound
	}
];
