export type Status = {
	id: number;
	command: string;
	type: string;
	path: string;
	article?: number;
	totalArticles?: number;
	locale: string;
	item?: number;
	error?: string;
	errors?: string[];
	total?: number;
	updated?: [];
	uploads?: [any];
	notFound?: [];
};

export type ValidParameters = { host: string; username: string; password: string };
