var step=1000, R, offset = parseInt(Args.offset), loop=0,
out = { oid: parseInt(Args.oid), ids:[], mass: parseInt(Args.mass), overlap: parseInt(Args.overlap), offset: 0, next: 0 };

while( offset <= out.mass  &&  loop < 25) {
	R = API.groups.getMembers({ "group_id": out.oid, "sort": "id_asc", "offset": offset, "count": step});
	if( !!R.items  &&  R.items.length > 0) {
		out.ids.push( R.items);
		out.mass = R.count;

		out.loop = loop;

		out.offset = offset;
		offset = offset + step - out.overlap;
		out.next = offset;
		
		loop = loop + 1;
	} else {
		out.error = "Empty items";
		out.r = R;
		return out;
	}
}

return out;