var FaceShiftParser = function( aniData, markerData ) {

	this.data = [];
	this.markers = [];

	if( aniData )
		this.parseAnimation( aniData ); 

	if( markerData )
		this.parseMarkerDescriptor( markerData );
};

FaceShiftParser.prototype = {

	parseAnimation: function( data ) {

		data = data.split( '\n' );

		for( var i = 0, fullLen = data.length; i < fullLen; i++ ) {

			if( data[ i ] ) {

				var curBlock = data[ i ].split( ' ' );
				var curBlockCount = 0;
				var curTimeStamp = 0;

				var blockData = {

					timeStamp: 0,
					head: {

						rotation: null,
						position: null
					},
					coefficients: null,
					eyes: {

						left: null,
						right: null
					},
					markers: null
				};

				for( var j = 0, len = curBlock.length; j < len; j++ ) {

					switch( curBlock[ j ] ) {

						//how many data blocks will be present
						case 'FS':

							curBlockCount = parseInt( curBlock[ j + 1 ] );
							j++;
						break;

						//timestamp
						case 'I':

							blockData.timeStamp = parseFloat( curBlock[ j + 1 ] );
							j++;
						break;

						//start of headers
						case '':

							curBlockCount = 0;
						break;

						//head rotation, translation
						case 'P':

							blockData.head.rotation = getVectorData( 4, j + 1, curBlock );
							blockData.head.position = getVectorData( 3, j + 4, curBlock );
							j += 7;	
						break;

						//blend shape coeffecients (pretty well ignored right now)
						case 'C':
							var numCoeffecients = parseInt( curBlock[ j + 1 ] );
														
							blockData.coefficients = getVectorData( numCoeffecients, j + 2, curBlock );

							j += numCoeffecients + 1;
						break;

						//eye rotations
						case 'E':

							var eyes = blockData.eyes;

							eyes.left = getVectorData( 2, j + 1, curBlock );
							eyes.right = getVectorData( 2, j + 3, curBlock );

							j += 4;
						break;

						//marker data
						case 'M':

							var numMarkers = parseInt( curBlock[ ++j ] );

							var markers = blockData.markers = [];

							j++; //increment to the first vertex value

							for( var k = 0; k < numMarkers; k++ ) {

								markers[ k ] = getVectorData( 3, j, curBlock );
								j += 3;
							}
						break;
					}
				}

				this.data.push( blockData );
			}
		}
	},

	parseMarkerDescriptor: function( data ) {

		data = data.split( '\n' );

		var numMarkers = null;
		this.markers = [];

		for( var i = 0, len = data.length; i < len; i++ ) {

			//line is not a comment
			if( data[ i ][ 0 ] != '#' ) {

				//since this is the first value this will be how many markers we have
				if( numMarkers === null ) {

					numMarkers = parseInt( data[ i ] );
				} else if( data[ i ] != '' ) {

					var curLine = data[ i ].split( ' ' );

					this.markers.push( curLine[ 0 ] );
				}
			}
		}
	},

	getMarkerIdx: function( markerName ) {

		return this.markers.indexOf( markerName );
	},

	getData: function() {
		return this.data;
	},

	getAniForMarker: function( markerName ) {

		var rVal = null,
			idx = this.getMarkerIdx( markerName ),
			aData = this.data,
			markers = null;

		if( idx > -1 ) {

			rVal = [];

			for( var i = 0, len = aData.length; i < len; i++ ) {

				rVal.push( {

					time: aData[ i ].timeStamp,
					marker: aData[ i ].markers[ idx ] 
				});
			}
		}

		return rVal;
	},

	

	addInterpolatedMarker: function( nMarkerName ) {

		var oIdx = [], //other indices
			nIdx = parseInt( nMarkerName, 10 ),
			aniData = [],
			markers = null,
			x = y = z = 0; //new index for markers

		// this.markers[ nIdx ] = markerName;

		for( var i = 1, len = arguments.length; i < len; i++ ) {

			var markerName = arguments[ i ];
			var nData = this.getAniForMarker( markerName );

			if( nData === null ) 
				throw markerName + ' isn\'t a defined marker.';

			aniData.push( nData );
		}


		for( var i = 0, len = aniData[ 0 ].length; i < len; i++ ) {

			x = y = z = 0;

			for( var j = 0, lenJ = aniData.length; j < lenJ; j++ ) {

				x += aniData[ j ][ i ].marker[ 0 ];
				y += aniData[ j ][ i ].marker[ 1 ];
				z += aniData[ j ][ i ].marker[ 2 ];
			}

			x /= lenJ;
			y /= lenJ;
			z /= lenJ;

			markers = this.data[ i ].markers;
			markers.splice( nIdx, 0, [ x, y, z ] );
			//markers[ nIdx ] = [ x, y, z ];
		}

		this.markers.splice( nIdx, 0, nMarkerName );
	}
};

function getVectorData( vectorLength, startIdx, data ) {

	var rVal = [];
	var endIdx = startIdx + vectorLength;

	for( var i = startIdx; i < endIdx; i++ ) {

		rVal.push( parseFloat( data[ i ] ) );
	}

	return rVal;
}

module.exports = FaceShiftParser;