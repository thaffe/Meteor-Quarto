public class JSONGame{
	private static final String  GROUND_URL = "http://quarto.meteor.com/";

	public static final String id = "gameID";
	public int index;
	public JSONPiece piece;
	public int boardTurn;


	public void initGameUrl(){
		return GROUND_URL+init+"/"+id;
	}

	public void exitGameUrl(){
		return GROUND_URL+exit+"/"+id;
	}

	public void requestPieceUrl(){
		return GROUND_URL+"getPiece/"
		id+"/"+
		index;
	}

	public void requestBoardPlaceUrl(){
		return GROUND_URL+"getBoard/"+
		id+"/"+
		index;

	public void placePieceUrl(int row, int col){
		return GROUND_URL+"board/"+
		id+"/"+
		index+"/"+
		row+"/"+
		col;
	}	

	public void selectPieceUrl(JSONPiece piece){
		return GROUND_URL+"piece/"+
		id+"/"+
		index+"/"+
		piece.isBlack+"/"+
		piece.isSquare+"/"+
		piece.isBig+"/"+
		piece.hasHole;
	} 
}