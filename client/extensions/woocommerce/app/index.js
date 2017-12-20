/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import page from 'page';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import {
	canCurrentUser,
	isSiteAutomatedTransfer,
	hasSitePendingAutomatedTransfer,
} from 'state/selectors';
import config from 'config';
import DocumentHead from 'components/data/document-head';
import { getSelectedSiteId } from 'state/ui/selectors';
import { listBlogStickers } from 'state/sites/blog-stickers/actions';
import QueryJetpackPlugins from 'components/data/query-jetpack-plugins';
import route from 'lib/route';

class App extends Component {
	static propTypes = {
		siteId: PropTypes.number,
		documentTitle: PropTypes.string,
		canUserManageOptions: PropTypes.bool.isRequired,
		currentRoute: PropTypes.string.isRequired,
		isAtomicSite: PropTypes.bool.isRequired,
		hasPendingAutomatedTransfer: PropTypes.bool.isRequired,
		children: PropTypes.element.isRequired,
	};

	componentDidMount = () => {
		const { siteId } = this.props;

		if ( siteId ) {
			this.props.listBlogStickers( siteId );
		}
	};

	componentWillReceiveProps( newProps ) {
		if ( this.props.children !== newProps.children ) {
			window.scrollTo( 0, 0 );
		}
	}

	componentDidUpdate( prevProps ) {
		const { siteId } = this.props;
		const oldSiteId = prevProps.siteId ? prevProps.siteId : null;

		if ( siteId && oldSiteId !== siteId ) {
			this.props.listBlogStickers( siteId );
		}
	}

	redirect = () => {
		window.location.href = '/stats/day';
	};

	render = () => {
		const {
			siteId,
			children,
			canUserManageOptions,
			isAtomicSite,
			hasPendingAutomatedTransfer,
			currentRoute,
			translate,
		} = this.props;

		// TODO This is temporary, until we have a valid "all sites" path to show.
		// Calypso will detect if a user doesn't have access to a site at all, and redirects to the 'all sites'
		// version of that URL. We don't want to render anything right now, so continue redirecting to my-sites.
		if ( ! route.getSiteFragment( currentRoute ) ) {
			this.redirect();
			return null;
		}

		if ( ! siteId ) {
			return null;
		}

		if (
			! isAtomicSite &&
			! hasPendingAutomatedTransfer &&
			! config.isEnabled( 'woocommerce/store-on-non-atomic-sites' )
		) {
			this.redirect();
			return null;
		}

		if ( ! canUserManageOptions ) {
			this.redirect();
			return null;
		}

		const documentTitle = this.props.documentTitle || translate( 'Store' );

		const className = 'woocommerce';
		return (
			<div className={ className }>
				<DocumentHead title={ documentTitle } />
				<QueryJetpackPlugins siteIds={ [ siteId ] } />
				{ children }
			</div>
		);
	};
}

function mapStateToProps( state ) {
	const siteId = getSelectedSiteId( state );
	const canUserManageOptions =
		( siteId && canCurrentUser( state, siteId, 'manage_options' ) ) || false;
	const isAtomicSite = ( siteId && !! isSiteAutomatedTransfer( state, siteId ) ) || false;
	const hasPendingAutomatedTransfer =
		( siteId && !! hasSitePendingAutomatedTransfer( state, siteId ) ) || false;

	return {
		siteId,
		canUserManageOptions,
		isAtomicSite,
		hasPendingAutomatedTransfer,
		currentRoute: page.current,
	};
}

function mapDispatchToProps( dispatch ) {
	return bindActionCreators(
		{
			listBlogStickers,
		},
		dispatch
	);
}

export default connect( mapStateToProps, mapDispatchToProps )( localize( App ) );
