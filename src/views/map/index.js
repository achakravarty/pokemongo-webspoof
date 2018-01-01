import axios from 'axios';

import React, { Component } from 'react';
import GoogleMap from 'google-map-react';
import { observable, action, toJS } from 'mobx';
import { observer } from 'mobx-react';
import Alert from 'react-s-alert';

import userLocation from '../../models/user-location.js';
import settings from '../../models/settings.js';

import SpeedCounter from './speed-counter.js';
import BooleanSettings from './boolean-settings.js';
import Coordinates from './coordinates.js';
import SpeedLimit from './speed-limit.js';
import Controls from './controls.js';
import TotalDistance from './total-distance.js';
import Autopilot from './autopilot.js';
import Pokeball from './pokeball.js';

import MapsApi from '../../config/api.js';

@observer
class Map extends Component {
	map = null;

	@observable
	mapOptions = {
		keyboardShortcuts: false,
		draggable: true
	};

	componentWillMount() {
		// get user geolocation
		// if (navigator.geolocation) {
		// 	navigator.geolocation.getCurrentPosition(
		//     this.handleGeolocationSuccess,
		//     this.handleGeolocationFail,
		//     { enableHighAccuracy: true, maximumAge: 0 }
		//   );
		// }

		// London
		// this.handleGeolocationSuccess({ coords: { latitude: 51.507341, longitude: -0.127654 } });

		// NYC
		// this.handleGeolocationSuccess({ coords: { latitude: 40.764762, longitude: -73.973121 } });

		// Santa Monica
		// this.handleGeolocationSuccess({ coords: { latitude: 34.010090, longitude: -118.496948 } });

		// Sacremento
		// this.handleGeolocationSuccess({ coords: { latitude: 38.387697, longitude: -121.429502 } });

		// Sydney
		// this.handleGeolocationSuccess({ coords: { latitude: -33.865935, longitude: 151.215482 } });

		// Melbourne
		// this.handleGeolocationSuccess({ coords: { latitude: -37.820855, longitude: 144.969598 } });

		// Sao Paulo
		// this.handleGeolocationSuccess({ coords: { latitude: -23.584369, longitude: -46.660948 } });

		// Singapore
		// this.handleGeolocationSuccess({ coords: { latitude: 1.36067684, longitude: 103.73457338 } });

		// Random
		this.handleGeolocationSuccess(
			{
				coords: {
					latitude: 38.847158,
					longitude: -94.387633
				}
			}
		);
	}

	// geolocation API might be down, use http://ipinfo.io
	// source: http://stackoverflow.com/a/32338735
	handleGeolocationFail = async (geolocationErr) => {
		Alert.warning(
			`
      <strong>Error getting your geolocation, using IP location</strong>
      <div class='stack'>${geolocationErr.message}</div>
    `,
			{
				timeout: 3000
			}
		);

		try {
			const {
				data: {
					loc
				}
			} = await axios(
				{
					url:
						'http://ipinfo.io/'
				}
			);
			const [
				latitude,
				longitude
			] = loc
				.split(
					','
				)
				.map(
					coord =>
						parseFloat(
							coord
						)
				);
			this.handleGeolocationSuccess(
				{
					coords: {
						latitude,
						longitude
					}
				}
			);
		} catch (xhrErr) {
			Alert.error(`
        <strong>Could not use IP location</strong>
        <div>Try to restart app, report issue to github</div>
        <div class='stack'>${xhrErr}</div>
      `);
		}
	};

	@action
	handleGeolocationSuccess({
		coords: {
			latitude,
			longitude
		}
	}) {
		userLocation.replace(
			[
				latitude,
				longitude
			]
		);
	}

	@action
	toggleMapDrag = () => {
		this.mapOptions.draggable = !this
			.mapOptions
			.draggable;
		this.map.map_.setOptions(
			toJS(
				this
					.mapOptions
			)
		);
	};

	@action
	handleClick = (
		{
			lat,
			lng
		},
		force
	) => {
		if (
			!this
				.mapOptions
				.draggable ||
			force
		) {
			this.autopilot.handleSuggestionChange(
				{
					suggestion: {
						latlng: {
							lat,
							lng
						}
					}
				}
			);
		}
	};

	render() {
		const [
			latitude,
			longitude
		] = userLocation;

		return (
			<div className='google-map-container'>
				{/* only display google map when user geolocated */}
				{latitude &&
				longitude ? (
					<GoogleMap
						ref={ (ref) => {
							this.map = ref;
						} }
						zoom={ settings.zoom.get() }
						center={ [
							latitude,
							longitude
						] }
						onClick={
							this
								.handleClick
						}
						options={ () =>
							this
								.mapOptions
						}
						onGoogleApiLoaded={
							this
								.handleGoogleMapLoaded
						}
						yesIWantToUseGoogleMapApiInternals
						apiKey={
							MapsApi.apiKey
						}>
						{/* userlocation center */}
						<Pokeball
							lat={
								userLocation[0]
							}
							lng={
								userLocation[1]
							}
						/>
					</GoogleMap>
				) : (
					<div
						style={ {
							position:
								'absolute',
							top:
								'calc(50vh - (100px / 2) - 60px)',
							left:
								'calc(50vw - (260px / 2))'
						} }
						className='alert alert-info text-center'>
						<i
							style={ {
								marginBottom: 10
							} }
							className='fa fa-spin fa-2x fa-refresh'
						/>
						<div>
							Loading
							user
							location
							&
							map...
						</div>
					</div>
				)}

				<div className='btn btn-drag-map'>
					{this
						.mapOptions
						.draggable ? (
							<div
								className='btn btn-sm btn-primary'
								onClick={
								this
									.toggleMapDrag
							}>
							Map
							draggable
						</div>
					) : (
						<div
							className='btn btn-sm btn-secondary'
							onClick={
								this
									.toggleMapDrag
							}>
							Map
							locked
						</div>
					)}
				</div>

				{/* controls, settings displayed on top of the map */}
				<Coordinates />
				<SpeedCounter />
				<SpeedLimit />
				<BooleanSettings />
				<Controls />
				<TotalDistance />
				<Autopilot
					ref={ (ref) => {
						this.autopilot = ref;
					} }
				/>
			</div>
		);
	}
}
export default Map;
