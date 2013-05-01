(function() {
  window.helpers = {
    enter: function(dom, callback) {
      return $(dom).keypress(function(e) {
        if (e.which === 13) {
          return callback(e);
        }
      });
    },
    click: function(dom, callback) {
      return $(dom).click(function(e) {
        return callback(e);
      });
    },
    dblclick: function(dom, callback) {
      return $(dom).dblclick(function(e) {
        return callback(e);
      });
    },
    href2title: function(dom) {
      var href, title;

      title = "";
      href = $(dom).attr("href");
      if (href.match("#")) {
        title = href.replace(/^#/, "");
      }
      return title;
    },
    hash2title: function(defaulttitle) {
      var res;

      res = location.hash.replace(/^#/, "");
      if (!res || res === "") {
        res = defaulttitle;
      }
      return res;
    }
  };

}).call(this);

(function() {
  var addChild, belong, db, default_position, default_title, deleteChild, getChildren, getParent, getParents, getTitle, hl, init, move, oneOrIns, schema, _addOrDeleteChild;

  default_title = "TOP";

  default_position = {
    x: 10,
    y: 150
  };

  init = function() {
    hl.enter("#input", function() {
      var lastword, title;

      title = $("#input").val();
      if (title.length > 0) {
        addChild(getTitle(), title, default_position);
        $("#input").val("");
        return move();
      } else {
        lastword = db.find("words", null, {
          order: "upd_at"
        })[0];
        alert(lastword);
        return move(lastword.title);
      }
    });
    hl.click("html", function(e) {
      var $input, title;

      $input = $("#input");
      $input.focus();
      title = $input.val();
      if (title.length > 0) {
        addChild(getTitle(), title, {
          x: e.clientX,
          y: e.clientY
        });
        $input.val("");
        return move();
      }
    });
    return move();
  };

  move = function(title) {
    var $li, body, main, parent, parent2, path, pathes, tag, top, word, _i, _j, _len, _len1, _ref, _ref1;

    if (title == null) {
      title = null;
    }
    $("#input").focus();
    if (!title) {
      title = getTitle();
    }
    word = oneOrIns('words', title);
    window.title = title;
    window.word = word;
    body = (word && word.body ? word.body : "");
    main = "<h1>" + title + "</h1>\n" + body;
    if (title !== default_title) {
      pathes = "";
      _ref = getParents(word);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        parent = _ref[_i];
        path = "";
        top = "<a href=\"#\" id=\"top\">TOP</a> > ";
        parent2 = parent;
        while (parent2.title !== default_title) {
          path = ("<a href=\"#" + parent2.title + "\" class=\"path\">" + parent2.title + "</a> > ") + path;
          parent2 = getParent(parent2);
        }
        pathes += top + path + title + "<br />";
      }
      main = pathes + main;
    }
    $("#main").html(main);
    $("#children").html("");
    _ref1 = getChildren(word.id);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      tag = _ref1[_j];
      word = db.one("words", {
        id: tag.child_id
      });
      title = word.title;
      $("#children").append("<li style=\" left:" + tag.left + "px; top:" + tag.top + "px\">\n<a href=\"#" + title + "\">" + title + "</a>\n</li>");
    }
    $li = $("#children li");
    $li.draggable({
      drag: function() {
        var left;

        window.$dragging = $(this);
        title = $(this).children("a").attr("href").replace(/^#/, "");
        word = oneOrIns('words', title);
        tag = db.one('tags', {
          parent_id: window.word.id + "",
          child_id: word.id + ""
        });
        left = $(this).css("left").replace("px", "");
        top = $(this).css("top").replace("px", "");
        return word = db.upd("tags", {
          id: tag.id,
          left: left,
          top: top
        });
      }
    });
    $li.droppable({
      over: function(event, ui) {
        return $(this).find("a").css("background", "#fc0");
      },
      out: function(event, ui) {
        return $(this).find("a").css("background", "#efe");
      },
      drop: function(event, ui) {
        var child_title, parent_title;

        window.$dragging.hide();
        parent_title = $(this).find("a").attr("href").replace(/^#/, "");
        child_title = $dragging.find("a").attr("href").replace(/^#/, "");
        belong(parent_title, child_title);
        return $(this).find("a").css("background", "#efe");
      }
    });
    $("#trash").droppable({
      over: function(event, ui) {
        return $(this).css("background", "#fc0");
      },
      out: function(event, ui) {
        return $(this).css("background", "#ccc");
      },
      drop: function(event, ui) {
        var child_title;

        window.$dragging.hide();
        child_title = $dragging.find("a").attr("href").replace(/^#/, "");
        deleteChild(getTitle(), child_title);
        return $(this).css("background", "#ccc");
      }
    });
    $("#google").click(function() {
      return window.open("http://google.com/#q=" + window.title, "_blank");
    });
    $("a").click(function(e) {
      title = hl.href2title(this);
      if (title.match(/^http/)) {
        return window.open(title, "_blank");
      } else {
        location.hash = "#" + title;
        return move(title);
      }
    });
    $("li").click(function(e) {
      return false;
    });
    return $("#top").click(function() {
      location.hash = "#" + default_title;
      return move(default_title);
    });
  };

  addChild = function(parent_title, child_title, xy) {
    if (xy == null) {
      xy = null;
    }
    return _addOrDeleteChild("add", parent_title, child_title, xy);
  };

  deleteChild = function(parent_title, child_title) {
    return _addOrDeleteChild("delete", parent_title, child_title);
  };

  belong = function(parent_title, child_title) {
    addChild(parent_title, child_title, default_position);
    return deleteChild(window.title, child_title);
  };

  oneOrIns = function(table_name, title) {
    var res;

    res = db.one(table_name, {
      TITLE: title.toUpperCase()
    });
    if (!res) {
      res = db.ins(table_name, {
        TITLE: title.toUpperCase(),
        title: title
      });
    }
    return res;
  };

  getChildren = function(parent_id) {
    var res;

    res = db.find('tags', {
      parent_id: parent_id + ""
    });
    return res;
  };

  _addOrDeleteChild = function(key, parent_title, child_title, xy) {
    var child, cond, parent, tag, _i, _len, _ref;

    if (xy == null) {
      xy = null;
    }
    parent = oneOrIns("words", parent_title);
    child = oneOrIns("words", child_title);
    cond = {
      child_id: child.id + "",
      parent_id: parent.id + ""
    };
    tag = db.one("tags", cond);
    if (key === "add") {
      _ref = getChildren(parent.id);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        child.top = Math.floor(child.top) + 50;
        db.upd("tags", child);
      }
      if (!tag) {
        cond.is_parent = false;
        tag = db.ins("tags", cond);
      }
      if (xy) {
        tag.top = xy.y;
        tag.left = xy.x;
      }
      return db.upd("tags", tag);
    } else if (key === "delete") {
      return db.del("tags", tag);
    }
  };

  hl = window.helpers;

  getTitle = function() {
    return hl.hash2title(default_title);
  };

  getParent = function(word) {
    var tag;

    tag = db.one("tags", {
      child_id: word.id + ""
    });
    return db.one("words", {
      id: tag.parent_id
    });
  };

  getParents = function(word) {
    var res, tag, _i, _len, _ref;

    res = [];
    _ref = db.find("tags", {
      child_id: word.id + ""
    });
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tag = _ref[_i];
      res.push(db.one("words", {
        id: tag.parent_id
      }));
    }
    return res;
  };

  schema = {
    words: {
      TITLE: true,
      title: true,
      body: "",
      $uniques: "TITLE"
    },
    tags: {
      child_id: true,
      parent_id: true,
      left: "",
      top: ""
    }
  };

  db = JSRel.use("mindia", {
    schema: schema,
    autosave: true
  });

  $(function() {
    return init();
  });

}).call(this);
