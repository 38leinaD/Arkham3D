function normalizeAngle(angle) {
	while (angle >= 2*Math.PI) {
		angle -= 2*Math.PI;
	}
	while (angle < 0.0) {
		angle += 2*Math.PI;
	}
	return angle;
}

function calcDirection(angle) {
	var v = vec3.create();
	v[0] = Math.cos(angle);
	v[1] = Math.sin(angle);
	v[2] = 0.0;
	return v;
}

function atan2(x, y) {
	var r = Math.atan2(x, y);
	if (r < 0.0) r = 2 * Math.PI + r;
	return r;
}

function smoothInterp(x) {
	return ((x) * (x) * (3 - 2 * (x)));
}

function renderQuadDown(vb, x, y, w, h, uvs) {
	vb.addData([ x, y - h, 0.0, uvs.u1, uvs.v2]);
	vb.addData([ x + w, y - h, 0.0, uvs.u2, uvs.v2]);
	vb.addData([ x, y, 0.0, uvs.u1, uvs.v1]);

	vb.addData([ x, y, 0.0, uvs.u1, uvs.v1]);
	vb.addData([ x + w, y - h, 0.0, uvs.u2, uvs.v2]);
	vb.addData([ x + w, y, 0.0, uvs.u2, uvs.v1]);
}

function renderQuad(vb, x, y, w, h, uvs) {
	vb.addData([ x, y, 0.0, uvs.u1, uvs.v1]);
	vb.addData([ x + w, y, 0.0, uvs.u2, uvs.v1]);
	vb.addData([ x, y + h, 0.0, uvs.u1, uvs.v2]);

	vb.addData([ x, y + h, 0.0, uvs.u1, uvs.v2]);
	vb.addData([ x + w, y, 0.0, uvs.u2, uvs.v1]);
	vb.addData([ x + w, y + h, 0.0, uvs.u2, uvs.v2]);

}

function drawQuad(vb, x, y, w, h) {
	vb.addData([ x, y, 0.0]);
	vb.addData([ x + w, y, 0.0]);
	vb.addData([ x, y + h, 0.0]);

	vb.addData([ x, y + h, 0.0]);
	vb.addData([ x + w, y, 0.0]);
	vb.addData([ x + w, y + h, 0.0]);
}

function drawLine(x1, y1, z1, x2, y2, z2, color) {
	var width = 1000;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

            mat4.ortho(this.pMatrix, 0.0, width, 0.0, height, 0.0, 10.0);
            mat4.identity(this.mvMatrix);
           
			G.colorShader.use();

			G.colorShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.colorShader.setUniformMatrix('uPMatrix', this.pMatrix);

			G.colorShader.setUniformf('uColor', color);

			G.colorVB.begin();

			G.colorVB.addData([x1, y1, z1]);
			G.colorVB.addData([x2, y2, z2]);

			G.colorVB.end();
			G.colorVB.render(G.colorShader, gl.LINES);
}

function animFrame(ticker, frames, frameDuration) {
	var f = ticker % (frames * frameDuration);
	return Math.floor(f / frameDuration);
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

function audioLevelForDistance(x1, y1, x2, y2) {
	var dsqr = ((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
	if (dsqr === 0.0) return 1.0;
	else return 1.0/dsqr;
}