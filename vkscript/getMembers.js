var step=4, overlap=2, R, offset = parseInt(Args.offset), loop=0,
out = { oid: parseInt(Args.oid), ids:[], mass: parseInt(Args.mass) };

while( offset <= out.mass  &&  loop < 25) {
	R = API.groups.getMembers({ "group_id": out.oid, "sort": "id_asc", "offset": out.offset, "count": step});
	if( !!R.items  &&  R.items.length > 0) {
		out.ids.push( R.items);
		out.mass = R.count;

		out.offset = offset;
		out.loop = loop;

		offset = out.offset + step - overlap;
		loop = loop + 1;
	} else {
		out.error = "Empty items";
		out.r = R;
		return out;
	}
}

return out;