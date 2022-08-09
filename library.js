'use strict';

const user = require.main.require('./src/user');
const controllers = require('./lib/controllers');
const auth = require('./lib/auth');
const deauth = require('./lib/deauth');
const plugin = {};

plugin.init = async params => {
	const router = params.router;
	const middleware = params.middleware;

	router.get('/admin/plugins/sso/lit-protocol', middleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/sso/lit-protocol', controllers.renderAdminPage);
	router.post('/deauth/lit-protocol', [middleware.requireUser, middleware.applyCSRF], controllers.deauth);

	auth.init();
};

plugin.addMenuItem = async header => {
	header.plugins.push({
		route: '/plugins/sso/lit-protocol',
		icon: 'fa-ethereum',
		name: 'Lit Protocol',
	});

	return header;
};

plugin.filterAuthInit = async loginStrategies => {
	loginStrategies.push({
		name: 'lit-protocol',
		url: '/auth/lit-protocol',
		urlMethod: 'post',
		callbackURL: '/auth/lit-protocol/callback',
		icon: 'fa-ethereum',
		scope: ''
	});

	return loginStrategies;
};

plugin.filterAuthList = async authList => {
	const { uid, associations } = authList;
	const address = await user.getUserField(uid, 'web3:address');

	if (address) {
		associations.push({
			associated: true,
			url: `https://www.etherscan.io/address/${address}`,
			deauthUrl: '#',
			name: 'web3 address',
			icon: 'fa-ethereum',
			component: 'web3/disassociate',
		});
	} else {
		associations.push({
			associated: false,
			name: 'web3 address',
			url: '#',
			icon: 'fa-ethereum',
			component: 'web3/associate',
		});
	}

	return authList;
};

plugin.filterUserWhitelistFields = async data => {
	data.whitelist.push('web3:address');
	return data;
};

plugin.staticUserDelete = deauth.deleteUserData;

module.exports = plugin;
