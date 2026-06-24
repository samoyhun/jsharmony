# Upgrading jsHarmony

## Upgrading from 1.x to 2.0

jsHarmony 2.0 replaces jQuery with a new library, XDom, which is typically accessed via jsh.XDom.

#### Existance check
jQuery:
```$('.selector').length```

XDom:
```jsh.XDom('.selector').length```

#### jsHarmony root queries

jQuery:
```jsh.$root('.selector')```

XDom:
```jsh.XDom(jsh.xdroot, '.selector')```

#### Template source

jQuery:
```jsh.$root(_this.TemplateID).html();```

XDom:
```jsh.XDom(jsh.xdroot, _this.TemplateID).select()[0].innerHTML;```

#### Append

jQuery:
```jsh.$root(_this.PlaceholderID).append(ejsrslt);```

XDom:
```jsh.XDom(_this.PlaceholderID).content.append(ejsrslt);```


#### Class manipulation

jQuery:
```jobj.addClass('sortAsc');```

XDom:
```xdObj.class.add('sortAsc');```


#### Element Data

jQuery:
```jsh.$root(grid_template).data('target');```

XDom:
```jsh.XDom(jsh.xdroot, grid_template).data.target;```

#### Slide

jQuery:
```jsh.$root('.xsearch_'+xmodel.class).slideDown(timeout,function(){ selectFirstSearchInput(); });```

XDom:
```jsh.XDom(jsh.xdroot, '.xsearch_'+xmodel.class).animate.height(true, function(){ selectFirstSearchInput(); }, timeout);```

#### Show

jQuery:
```jsh.$root('.xtitlecaption'+xmodel.class).show();```

XDom:
```jsh.XDom(jsh.xdroot, '.xtitlecaption'+xmodel.class).style.display = true;```


### Replace jQuery objects in method arguments with plain elements

Many callbacks and other interface methods formally took jquery wrapped sets. These should be replaed with plain dom elements, or arrays of elements where requried. These arguments were often called `jobj` or similar depending on purpose, and will now be simply `obj` or similar without the `j`. Arrays will commonly have a leading underscore, e.g. `_el`.

#### xgrid OnRowBind (first argument)

```if(xgrid.OnRowBind) xgrid.OnRowBind(xdRow.select(), newrow);```

#### XEditableGrid.BindRow (first argument)

```xeditablegrid.BindRow(*obj*,datarow);```

#### xform.SetIndex (optional third argument)

```xform.SetIndex(rowid, false, rows[rowid]);```

#### xform.Data._jrow

`XForm.Data._jrow` has become `XForm.Data._row`, and is a plain element.

#### datamodel BindLOV (optional second argument)

```xmodel.datamodel.prototype.BindLOV(xform,*obj*);```

#### XModel.RenderField (second argument and return value)

```
XExt.XModel.RenderField(
  xform.DataSet[dbrowid],
  jsh.XDom(jsh.xdroot, xgrid.PlaceholderID).selector("tr[data-id='" + dbrowid + "']").selectOne(), 
  xmodel.id, 
  xform.Data.Fields[key],
  xform.DataSet[dbrowid][key],
  { updatePreviousValue: false }
);
```

#### XModel.GetRowID (second argument)

```rowid = jsh.XExt.XModel.GetRowID(modelid, *rowref*);```

#### ongetvalue (forth parameter) TBD XModel callback in defined in tutorials etc.
  - jctrl
#### model.onrow(un)bind specifies a jobj argument TBD
#### XPage.Enable (first argument)
#### XPage.Disable (first argument)
#### XExt.Render(Parent)LOV (second argument)
#### XExt.TreeRender (first argument)
#### XExt.TreeSelectNode (first argument)
#### XExt.TagBox_Render (both arguments)
#### XExt.TagBox_Refresh (both arguments)
#### popupShow jquery arguments TBD
#### jsh.XBarcode.EnableScanner($(this)); TBD needs request

### jsharmony-validate TBD

### jQuery and jQuery plugins are not provided

#### .datepicker TBD
#### colorbox TBD

#### $.param

the `XExt.escapeQuery` function should behave similarly to `$.param`. Note: escapeQuery does not execute functions.

Before:
```$.param({ data: JSON.stringify(execdata) })```

After:
```jsh.XExt.escapeQuery({ data: JSON.stringify(execdata) })```



