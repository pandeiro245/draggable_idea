default_title = "TOP"
default_position = {x: 10, y: 150}

init = () ->
  hl.enter("#input", ()->
    title = $("#input").val()
    if title.length > 1
      addChild(getTitle(), title, default_position)
      $("#input").val("")
      move()
    else
      lastword = db.find("words", null, {order: "upd_at"})[0]
      alert lastword
      move(lastword.title)
  )

  hl.click("html", (e)->
    $input = $("#input")
    $input.focus()
    title = $input.val()
    if title.length > 1
      addChild(getTitle(), title, {x: e.clientX, y: e.clientY})
      $input.val("")
      move()
  )

  move()

move = (title = null) ->
  $("#input").focus()
  title = getTitle() unless title
  word = oneOrIns('words', title)
  window.title = title
  window.word = word
  body = (if word && word.body then word.body else "")
  main = """
    <h1>#{title}</h1>
    #{body}
  """
  if title != default_title
    pathes = ""
    for parent in getParents(word)
      path = ""
      top = "<a href=\"#\" id=\"top\">TOP</a> > "
      parent2 = parent
      while(parent2.title != default_title)
        path = "<a href=\"##{parent2.title}\" class=\"path\">#{parent2.title}</a> > " + path
        parent2 = getParent(parent2)
      pathes += top + path + title + "<br />"
    main = pathes + main

  $("#main").html(main)
  $("#children").html("")
  for tag in getChildren(word.id)
    word = db.one("words", {id: tag.child_id})
    title = word.title
    $("#children").append("""
      <li style=\" left:#{tag.left}px; top:#{tag.top}px\">
      <a href=\"##{title}\">#{title}</a>
      </li>
    """)
  $li = $("#children li")
  $li.draggable({
    drag: ()->
      window.$dragging = $(this)
      title = $(this).children("a").attr("href").replace(/^#/,"")
      word = oneOrIns('words', title)
      tag = db.one('tags', {parent_id: window.word.id+"", child_id: word.id+""})
      left = $(this).css("left").replace("px", "")
      top = $(this).css("top").replace("px", "") 
      word = db.upd("tags", {id: tag.id, left: left, top: top})
  })
  $li.droppable({
    #accept: "#children li",
    over: (event, ui) ->
      $(this).find("a").css("background", "#fc0")
    ,
    out: (event, ui) ->
      $(this).find("a").css("background", "#efe")
    drop: (event, ui) ->
      window.$dragging.hide()
      parent_title = $(this).find("a").attr("href").replace(/^#/,"")
      child_title = $dragging.find("a").attr("href").replace(/^#/,"")
      belong(parent_title, child_title)
      $(this).find("a").css("background", "#efe")
  })

  $("#trash").droppable({
    #accept: "#children li",
    over: (event, ui) ->
      $(this).css("background", "#fc0")
    ,
    out: (event, ui) ->
      $(this).css("background", "#ccc")
    drop: (event, ui) ->
      window.$dragging.hide()
      child_title = $dragging.find("a").attr("href").replace(/^#/,"")
      deleteChild(getTitle(), child_title)
      $(this).css("background", "#ccc")
  })


  $("#google").click(()->
    window.open("http://google.com/#q=#{window.title}", "_blank")
  )

  $("a").click((e)->
    title = hl.href2title(this)
    if title.match(/^http/)
      window.open(title, "_blank")
    else
      location.hash = "##{title}"
      move(title)
  )

  $("li").click((e)->
    return false
  )

  $("#top").click(()->
    location.hash = "##{default_title}"
    move(default_title)
  )

addChild = (parent_title, child_title, xy=null) ->
  _addOrDeleteChild("add", parent_title, child_title, xy)

deleteChild = (parent_title, child_title) ->
  _addOrDeleteChild("delete", parent_title, child_title)

belong = (parent_title, child_title) ->
  addChild(parent_title, child_title, default_position)
  deleteChild(window.title, child_title)

oneOrIns = (table_name, title) ->
  res = db.one(table_name, {TITLE: title.toUpperCase()})
  if !res
    res = db.ins(table_name, {
      TITLE: title.toUpperCase(),
      title: title},
    )
  res

getChildren = (parent_id) ->
  res = db.find('tags', {parent_id: parent_id+""})
  res

_addOrDeleteChild = (key, parent_title, child_title, xy=null) ->
  parent = oneOrIns("words", parent_title)
  child  = oneOrIns("words", child_title)
  cond = {child_id: child.id+"", parent_id: parent.id+""}
  tag = db.one("tags", cond)
  if key == "add"
    for child in getChildren(parent.id)
      child.top = Math.floor(child.top) + 50
      db.upd("tags", child)
    unless tag
      cond.is_parent = false
      tag = db.ins("tags", cond)
    if xy
      tag.top = xy.y
      tag.left = xy.x
    db.upd("tags", tag)
  else if key == "delete"
    db.del("tags", tag)

hl = window.helpers

getTitle = ()->
  hl.hash2title(default_title)

getParent = (word) ->
  tag = db.one("tags", {child_id: word.id+""})
  db.one("words", {id: tag.parent_id})

getParents = (word) ->
  res = []
  for tag in db.find("tags", {child_id: word.id+""})
    res.push(db.one("words", {id: tag.parent_id}))
  res

schema = {
  words: {
    TITLE: true, title: true,
    body: "",
    $uniques: "TITLE"
  },
  tags: {
    child_id: true, parent_id: true,
    left: "", top: "",
  }
}

db = JSRel.use("mindia", {
  schema: schema,
  autosave: true
})

$(() ->
  init()
)
