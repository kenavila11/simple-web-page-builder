import React, { Component } from 'react';
import { EditorState, convertToRaw, ContentState  } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import jsonData from '../db.json';
import Row from './row';
import Column from './column';
import KenModal from './kenmodal';

class Builder extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rows: [],
            modalState: {
                styles: { display: "none" },
                title: "",
                body: ""
            },
            editorState: EditorState.createEmpty()
        }
           
        this.closeModal = this.closeModal.bind(this);
        this.addRow = this.addRow.bind(this);
        this.editRow = this.editRow.bind(this);
        this.removeRow = this.removeRow.bind(this);

        this.addColumn = this.addColumn.bind(this);
        this.editColumn = this.editColumn.bind(this);
        this.removeColumn = this.removeColumn.bind(this);

        this.handleChange = this.handleChange.bind(this);
        this.onEditorStateChange = this.onEditorStateChange.bind(this);

        this.moveColumn = this.moveColumn.bind(this);
    }

    componentDidMount() {
        // fetch('https://my-json-server.typicode.com/kenavila11/mydb/db')
        //     .then(res => res.json())
        //     .then(data => {
        //         this.setState({ rows: data.rows });
        //     });
        this.setState({ rows: jsonData.rows });
    }

    render() { 

        console.log(this.state.rows);

        console.log(this.state.editorState);

        const convertToDom = (content) => {
            return <div className="content" dangerouslySetInnerHTML={{__html: content}}></div>;
        }

        const { editorState } = this.state;

        return (
            <div className="container">
                <div className="row justify-content-end">
                    <button className="btn btn-secondary mb-2" onClick={ this.addRow }>Add Row</button>
                </div>
                { this.state.rows.map(row => 
                    <Row 
                        key={row.id} 
                        attr={row}
                        onEdit={this.editRow}
                        onRemove={this.removeRow}>
                            {row.columns.map( col =>  
                                <Column 
                                    key={col.id} 
                                    attr={col}
                                    row={row}
                                    onMove={this.moveColumn}
                                    onEdit={this.editColumn}
                                    onRemove={this.removeColumn}>
                                        { convertToDom(col.content) }
                                </Column>    
                            )}
                    </Row>
                )}
                <KenModal 
                    styles={this.state.modalState.styles}
                    title={this.state.modalState.title}
                    onClose={this.closeModal}>
                        <Editor
                            editorState={editorState}
                            onEditorStateChange={this.onEditorStateChange}
                            wrapperClassName="wrapper-class"
                            editorClassName="editor-class"
                            toolbarClassName="toolbar-class"
                            wrapperStyle={ {backgroundColor: "#fff", margin: "10px 0px 10px"} }
                            editorStyle={ {backgroundColor: "#fff", padding: "0px 15px", maxHeight: "150px", minHeight: "100px"} }
                            />
                        {this.state.modalState.body}
                </KenModal>
            </div>
        );
    }

    onEditorStateChange(editorState) {
        this.setState({
          editorState,
        });
    };

    closeModal() {
        this.setState({
            modalState: {
                styles: {
                    display: "none"
                }
            }
        });
    }

    addRow() {

        // fetch('https://my-json-server.typicode.com/kenavila11/mydb/rows', {
        //         method: 'POST',
        //         body: JSON.stringify({
        //             "columns": document.getElementById("selectColumns").value,
        //             "class": "My row"
        //         }),
        //         headers: {
        //             "Content-type": "application/json; charset=UTF-8"
        //         }
        //     })
        //     .then(res => res.json())
        //     .then(data => {
        //         const d = data;
        //         this.setState(state => state.rows.push(d));
        //     })
        const lastRow = this.state.rows.slice(-1)[0];
        this.setState(state => state.rows.push({
            "id": ((lastRow) ? lastRow.id : 0) + 1,
            "columns": [],
            "class": "My row"
        }))
    }

    editRow(row) {

        const rowId = row.id;
        const widthOpts = [];
        for(let i = 1; i <= 12; i++ ) { widthOpts.push(<option key={i} value={i}>{i}</option>) }
        this.setState({
            modalState: {
                styles: { display: "block" },
                title: <h4>Editing Row ID: {rowId}</h4>,
                body: <div>
                        <div className="form-group">
                            <label>Width</label>
                            <select name="columnWidth" onChange={this.handleChange} defaultValue="1" className="form-control form-control-sm" id="columnWidth">
                                {widthOpts}
                            </select>
                        </div>
                        <div className="form-group">
                            <button 
                                className="btn btn-sm btn-primary btn-block" 
                                onClick={() => this.addColumn(rowId)}
                                >Add Column</button>
                        </div>
                    </div>
            }
        })
    }

    removeRow(row) {

        const rowId = row.id;
        const newRows = this.state.rows.filter( row => row.id !== rowId );
        this.setState({ rows: newRows })
    }


    addColumn(rowId) {

        const editorContent = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
        const colWidth = parseInt(document.getElementById("columnWidth").value);

        this.setState({
            editorState: EditorState.createEmpty()
        })

        this.setState({
            rows: this.state.rows.map(function(row) {
                if(row.id === rowId) {
                    let currentCols = (row.columns) ? row.columns : [];
                    currentCols.push({
                        "id": ( currentCols.length ) ? currentCols.slice(-1)[0]["id"]+1 : 1, 
                        "width": colWidth,
                        "content": editorContent
                    })
                    return Object.assign({}, row, { "columns": currentCols });
                }else{
                    return row;
                }
            })
        });
    }

    editColumn(row, col) {
        
        const rowId = row.id;
        const colId = col.id;
        const widthOpts = [];
        for(let i = 1; i <= 12; i++ ) { widthOpts.push(<option key={i} value={i}>{i}</option>) }

        const { editorState } = this.state;

        const blocksFromHtml = htmlToDraft(col.content);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        const renderContent = EditorState.createWithContent(contentState);
        this.setState({
            editorState: renderContent
        });
        
        this.setState({
            modalState: {
                styles: { display: "block" },
                title: <h4>Editing Colum ID: {colId} of Row ID: {rowId}</h4>,
                body: <div>
                        <div className="form-group">
                            <label>Width</label>
                            <select name="columnWidth" onChange={this.handleChange} defaultValue={col.width} className="form-control form-control-sm" id="columnWidth">
                                {widthOpts}
                            </select>
                        </div>
                        <div className="form-group">
                            <button 
                                className="btn btn-sm btn-primary btn-block" 
                                onClick={() => {
                                    const colWidth = parseInt(document.getElementById("columnWidth").value);
                                    this.setState({
                                        rows: this.state.rows.map(row => {
                                            if(row.id === rowId){
                                                const cols = [...row.columns];
                                                const c = cols.filter(col => col.id === colId);
                                                const i = cols.indexOf(c.pop());
                                                cols[i]["width"] = colWidth;
                                                cols[i]["content"] = draftToHtml(convertToRaw(this.state.editorState.getCurrentContent()));
                                                return Object.assign({}, row, { "columns": [...cols] });
                                            }else{
                                                return row;
                                            }
                                        })
                                    })
                                }}
                                >Update Column</button>
                        </div>
                    </div>
            }
        })
    }

    removeColumn(row, col) {

        const rowId = row.id;
        const colId = col.id;
        this.setState({
            rows: this.state.rows.map(function(row) {
                if(row.id === rowId) {
                    let currentCols = (row.columns) ? row.columns : [];
                    let filteredCols = currentCols.filter(col => col.id !== colId);
                    return Object.assign({}, row, { "columns": [...filteredCols] });
                }else{
                    return row;
                }
            })
        })
    }

    moveColumn(row, col, direction) {

        let columns = row.columns;
        console.log(direction);

        let oldIndex = columns.indexOf(col);
        if (oldIndex > -1){
            let newIndex = (oldIndex + (direction === "left" ? -1 : 1));
            if (newIndex < 0){
                newIndex = 0
            }else if (newIndex >= columns.length){
                newIndex = columns.length
            }
            let columnsClone = columns.slice();
            columnsClone.splice(oldIndex,1);
            columnsClone.splice(newIndex,0,col);

            this.setState({
                rows: this.state.rows.map(r => {
                    if(r.id === row.id){
                        return Object.assign({}, r, { "columns": [...columnsClone] });
                    }else{
                        console.log(r);
                        return r;
                    }
                })
            });
        }
        console.log("there");
    }

    handleChange() {

    }
}
 
export default Builder;