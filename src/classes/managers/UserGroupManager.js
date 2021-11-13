import { UserAPIManager } from "./APIManager.js"

export class UserGroupManager extends UserAPIManager {
	async fetchGroups() {
		await this.client.request.groups(`/v1/users/${this.user.id}/groups/roles`)
	}
}