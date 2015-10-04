var oid=parseInt(Args.oid), screen_name=Args.screen_name, R, out={oid:oid, screen_name:"", name:"", mass:"", ioid:oid};

if( screen_name) {
	out.sn = screen_name;
	out.log = "passed screen name";
    R=API.utils.resolveScreenName( {"screen_name": screen_name});
    if( !R  ||  !R.object_id) {
        out.err_msg = "screen_name not resolved";
        out.err_code = 5;
        return out;
    }
    if( R.type == "user") {
	    out.oid = R.object_id;
    } else if( R.type == "group"  ||  R.type == "page") {
	    out.oid = -R.object_id;
    } else {
        out.err_msg = R.type+" found. Group or Page expected";
        out.err_code = 6;
        return out;
    }
} 

if( out.oid > 0) {
	R = API.users.get({
	    "user_ids": out.oid,
	    "fields": "photo_50,online,last_seen,can_write_private_message,counters,screen_name",
	});
	
	if( !R  ||  (R.length==0)) {
	    out.err_msg = "No user with such id";
	    out.err_code = 4;
	    return out;
	} else if( R[0].deactivated) {
	    out.err_msg = "User is deactivated";
	    out.err_code = 4;
	    return out;
	}

	out.data = R[0];
	out.mass = R[0].counters.friends + R[0].counters.followers;
	out.name = R[0].first_name +" "+R[0].last_name;
} else {
	R = API.groups.getById({
	    "group_id": -out.oid,
	    "fields": "members_count,photo_50",
	});
	
	if( !R  ||  (R.length==0)) {
	    out.err_msg = "No group with such id";
	    out.err_code = 4;
	    return out;
	} else if( R[0].deactivated) {
	    out.err_msg = "Group is deactivated";
	    out.err_code = 4;
	    return out;
	}

	out.mass = R[0].members_count;
	out.name = R[0].name;
	if( R[0].is_closed) out.is_closed = R[0].is_closed;
}
out.screen_name = R[0].screen_name;
out.photo_50 = R[0].photo_50;

return out;