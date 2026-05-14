import { gameStoreSelectors, useGameStore } from "../store/useGameStore";
import type { Border } from "../types/game";

function getSelectedBorder(borders: Border[], selectedBorderId: string | null) {
  return borders.find((border) => border.id === selectedBorderId) ?? borders[0] ?? null;
}

function toSideLabel(side: Border["side"]) {
  if (side === "top") {
    return "上边";
  }

  if (side === "right") {
    return "右边";
  }

  if (side === "bottom") {
    return "下边";
  }

  return "左边";
}

export function BorderEditorPanel() {
  const borders = useGameStore(gameStoreSelectors.selectBorders);
  const borderEditor = useGameStore(gameStoreSelectors.selectBorderEditor);
  const toggleBorderEditor = useGameStore((state) => state.toggleBorderEditor);
  const selectEditorBorder = useGameStore((state) => state.selectEditorBorder);
  const updateEditorBorder = useGameStore((state) => state.updateEditorBorder);
  const setEditorBorderSegmentCount = useGameStore((state) => state.setEditorBorderSegmentCount);
  const updateEditorBorderSegmentColor = useGameStore((state) => state.updateEditorBorderSegmentColor);

  const selectedBorder = getSelectedBorder(borders, borderEditor.selectedBorderId);

  return (
    <section className="ui-shell ui-shell--right border-editor-shell" aria-label="边框编辑器">
      <div className="editor-toolbar">
        <div>
          <span className="eyebrow">Border Editor</span>
          <h2>边框调参</h2>
        </div>

        <button type="button" className="ghost-button" onClick={toggleBorderEditor}>
          {borderEditor.isOpen ? "收起" : "展开"}
        </button>
      </div>

      <p className="editor-description">编辑器是挂在游玩页上的独立调参层，收起或后续移除时不会影响边框渲染主链路。</p>

      {!borderEditor.isOpen ? (
        <div className="editor-summary-card">
          <span>当前边框数</span>
          <strong>{borders.length}</strong>
        </div>
      ) : selectedBorder ? (
        <>
          <label className="editor-field">
            <span>当前边框</span>
            <select value={selectedBorder.id} onChange={(event) => selectEditorBorder(event.currentTarget.value)}>
              {borders.map((border) => (
                <option key={border.id} value={border.id}>
                  {toSideLabel(border.side)}
                </option>
              ))}
            </select>
          </label>

          <div className="editor-grid">
            <label className="editor-field">
              <span>X</span>
              <input
                type="number"
                step={1}
                value={selectedBorder.bounds.x}
                onChange={(event) => updateEditorBorder(selectedBorder.id, { bounds: { x: event.currentTarget.valueAsNumber } })}
              />
            </label>

            <label className="editor-field">
              <span>Y</span>
              <input
                type="number"
                step={1}
                value={selectedBorder.bounds.y}
                onChange={(event) => updateEditorBorder(selectedBorder.id, { bounds: { y: event.currentTarget.valueAsNumber } })}
              />
            </label>

            <label className="editor-field">
              <span>Width</span>
              <input
                type="number"
                min={1}
                step={1}
                value={selectedBorder.bounds.width}
                onChange={(event) => updateEditorBorder(selectedBorder.id, { bounds: { width: event.currentTarget.valueAsNumber } })}
              />
            </label>

            <label className="editor-field">
              <span>Height</span>
              <input
                type="number"
                min={1}
                step={1}
                value={selectedBorder.bounds.height}
                onChange={(event) => updateEditorBorder(selectedBorder.id, { bounds: { height: event.currentTarget.valueAsNumber } })}
              />
            </label>
          </div>

          <div className="editor-inline-metrics">
            <div className="editor-summary-card">
              <span>长度</span>
              <strong>{selectedBorder.fullLength}</strong>
            </div>

            <label className="editor-field editor-field--compact">
              <span>分段数量</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, selectedBorder.fullLength)}
                step={1}
                value={selectedBorder.segments.length}
                onChange={(event) => setEditorBorderSegmentCount(selectedBorder.id, event.currentTarget.valueAsNumber)}
              />
            </label>
          </div>

          <div className="segment-editor-list">
            {selectedBorder.segments.map((segment, index) => (
              <label key={`${selectedBorder.id}-${index}-${segment.start}`} className="segment-editor-item">
                <span>
                  第 {index + 1} 段 ({segment.length}px)
                </span>

                <div className="segment-color-row">
                  <input
                    type="color"
                    value={segment.color}
                    onChange={(event) => updateEditorBorderSegmentColor(selectedBorder.id, index, event.currentTarget.value)}
                  />
                  <code>{segment.color}</code>
                </div>
              </label>
            ))}
          </div>
        </>
      ) : (
        <p className="editor-empty">当前没有可编辑的边框数据。</p>
      )}
    </section>
  );
}
