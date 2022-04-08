module.exports = {
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            }
        ],
    },
    resolve: {
		extensions: [ '.tsx', '.ts', '.js', '.json' ],
	}
}